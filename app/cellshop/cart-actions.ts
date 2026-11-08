"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCellshopViewer } from "@/lib/cellshop/queries";
import { variantPrice, type PriceMode, type PricedProduct } from "@/lib/cellshop/pricing";
import { isCartToken, parseCartContact, RETENTION_DAYS, sanitizeSyncItems } from "@/lib/cellshop/cart-recovery";
import { hashRateLimitKey, isRateLimitAllowed } from "@/lib/leads/rate-limit";
import { DEVICES, TRAFFIC_SOURCES } from "@/lib/analytics/sources";

/**
 * Cópia do carrinho no painel (Loja completa → Carrinhos parados).
 * O navegador manda só os ids e as quantidades; nome, versão e preço vêm do banco.
 * Contato (nome e WhatsApp) só com a autorização marcada pelo próprio cliente.
 */
type SyncInput = {
  token: unknown;
  items: unknown;
  dev?: unknown;
  src?: unknown;
  /** undefined = não mexe no contato; objeto = salva (com autorização). */
  contact?: { name: unknown; whatsapp: unknown; consent: unknown };
};

export type SyncResult = { ok: true } | { ok: false; error: "name" | "whatsapp" | "consent" | "rate_limited" | "server_error" };

async function allowed(key: string, windowSeconds: number, max: number) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_lead_rate_limit", {
    p_key_hash: hashRateLimitKey(`cart:${key}`, process.env.SUPABASE_SERVICE_ROLE_KEY),
    p_window_seconds: windowSeconds,
    p_max_requests: max,
  });
  return isRateLimitAllowed(data, error);
}

async function requestInfo() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  let city: string | null = null;
  try {
    const raw = h.get("x-vercel-ip-city");
    city = raw ? decodeURIComponent(raw).slice(0, 80) : null;
  } catch {
    city = null;
  }
  return { ip, city };
}

type ProductRow = PricedProduct & {
  id: string;
  brand: string;
  name: string;
  slug: string;
  is_active: boolean;
  wholesale_only: boolean;
  store_product_variants: { id: string; name: string; price: number | string | null; wholesale_price: number | string | null }[];
};

export async function syncCart(input: SyncInput): Promise<SyncResult> {
  if (!isCartToken(input?.token)) return { ok: false, error: "server_error" };
  const token = input.token;
  const items = sanitizeSyncItems(input.items);
  const { ip, city } = await requestInfo();

  const wantsContact = input.contact !== undefined;
  if (!(await allowed(`${wantsContact ? "contact" : "sync"}:${ip}`, 600, wantsContact ? 10 : 120))) {
    return { ok: false, error: "rate_limited" };
  }

  const admin = createAdminClient();

  // Carrinho vazio: apaga a cópia (inclusive o contato).
  if (items.length === 0) {
    await admin.from("store_carts").delete().eq("token", token).in("status", ["open", "checked_out"]);
    return { ok: true };
  }

  let contact: { contact_name: string; whatsapp: string; consent_at: string } | null = null;
  if (wantsContact) {
    const parsed = parseCartContact(input.contact?.name, input.contact?.whatsapp, input.contact?.consent);
    if (!parsed.ok) return { ok: false, error: parsed.error };
    contact = { contact_name: parsed.name, whatsapp: parsed.whatsapp, consent_at: new Date().toISOString() };
  }

  const viewer = await getCellshopViewer();
  const mode: PriceMode = viewer?.status === "approved" ? "wholesale" : "retail";

  const { data: products } = await admin
    .from("store_products")
    .select("id,brand,name,slug,price,wholesale_price,card_price,card_installments,is_active,wholesale_only,store_product_variants(id,name,price,wholesale_price)")
    .in("id", [...new Set(items.map((i) => i.productId))]);
  const byId = new Map(((products ?? []) as ProductRow[]).map((p) => [p.id, p]));

  const stored: { productId: string; variantId: string | null; slug: string; title: string; variantName: string | null; qty: number; price: number | null }[] = [];
  let total = 0;
  let count = 0;
  let hasUnpriced = false;
  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product || !product.is_active || (product.wholesale_only && mode !== "wholesale")) continue;
    const variant = item.variantId ? product.store_product_variants.find((v) => v.id === item.variantId) ?? null : null;
    const raw = variantPrice(product, variant, mode);
    const price = raw !== null && raw > 0 ? raw : null;
    if (price === null) hasUnpriced = true;
    else total += price * item.qty;
    count += item.qty;
    stored.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      slug: product.slug,
      title: `${product.brand} ${product.name}`,
      variantName: variant && product.store_product_variants.length > 1 ? variant.name : null,
      qty: item.qty,
      price,
    });
  }
  if (stored.length === 0) {
    await admin.from("store_carts").delete().eq("token", token).in("status", ["open", "checked_out"]);
    return { ok: true };
  }

  const dev = typeof input.dev === "string" && (DEVICES as readonly string[]).includes(input.dev) ? input.dev : null;
  const src = typeof input.src === "string" && (TRAFFIC_SOURCES as readonly string[]).includes(input.src) ? input.src : null;

  const { data: existing } = await admin.from("store_carts").select("id,status").eq("token", token).maybeSingle();
  const now = new Date().toISOString();
  const row = {
    mode,
    reseller_id: mode === "wholesale" ? viewer?.id ?? null : null,
    items: stored,
    item_count: count,
    total: Math.round(total * 100) / 100,
    has_unpriced: hasUnpriced,
    updated_at: now,
    ...(contact ?? {}),
  };

  let error;
  if (existing) {
    // Mexeu no carrinho de novo: volta a ser um carrinho aberto.
    const reopen = existing.status === "checked_out" || existing.status === "open" ? { status: "open", checked_out_at: null } : {};
    ({ error } = await admin.from("store_carts").update({ ...row, ...reopen }).eq("id", existing.id));
  } else {
    ({ error } = await admin.from("store_carts").insert({ ...row, token, device: dev, traffic_source: src, city }));
  }
  if (error) {
    console.error("[carrinho] salvar:", error.message);
    return { ok: false, error: "server_error" };
  }

  // Faxina de vez em quando: carrinhos com mais de 90 dias saem do banco.
  if (Math.random() < 0.02) {
    const limit = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString();
    await admin.from("store_carts").delete().lt("updated_at", limit);
  }
  return { ok: true };
}

/** O cliente tirou o contato do carrinho: apaga nome e WhatsApp. */
export async function forgetCartContact(token: unknown): Promise<{ ok: boolean }> {
  if (!isCartToken(token)) return { ok: false };
  const admin = createAdminClient();
  await admin.from("store_carts").update({ contact_name: null, whatsapp: null, consent_at: null }).eq("token", token);
  return { ok: true };
}

/** Clicou em "Finalizar pelo WhatsApp": não é mais um carrinho parado. */
export async function markCartCheckedOut(token: unknown): Promise<{ ok: boolean }> {
  if (!isCartToken(token)) return { ok: false };
  const admin = createAdminClient();
  const now = new Date().toISOString();
  await admin.from("store_carts").update({ status: "checked_out", checked_out_at: now, updated_at: now }).eq("token", token).eq("status", "open");
  return { ok: true };
}
