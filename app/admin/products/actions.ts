"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Confere se existe uma sessão de admin válida. Nunca confiar em informação
 * vinda do cliente — getClaims() valida o JWT (assinatura + expiração).
 * Redireciona para o login se não houver sessão válida.
 */
export async function requireAdminSession(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (!userId) {
    redirect("/admin/login");
  }

  // Autenticação e autorização são fronteiras diferentes: uma sessão válida
  // só ganha acesso administrativo se estiver explicitamente habilitada.
  const admin = createAdminClient();
  const { data: adminUser, error } = await admin
    .from("admin_users")
    .select("role,is_active")
    .eq("user_id", userId)
    .eq("role", "ADMIN")
    .eq("is_active", true)
    .maybeSingle();

  if (error || !adminUser) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not_authorized");
  }
  return userId;
}

export async function logAdminAction(userId: string, action: string, entityType: string, entityId?: string, metadata: Record<string, unknown> = {}) {
  const admin = createAdminClient();
  const { error } = await admin.rpc("log_admin_action", {
    p_admin_user_id: userId,
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId ?? null,
    p_metadata: metadata,
  });
  if (error) console.error("[audit] falha ao registrar ação administrativa:", error);
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type ParsedProduct = {
  brand: string;
  model: string;
  slug: string;
  sku: string | null;
  category: string;
  description: string;
  price: number;
  availability: string;
  warranty: string;
  pickup_available: boolean;
  is_active: boolean;
};

type ParseResult =
  | { ok: true; data: ParsedProduct }
  | { ok: false; error: string };

/**
 * Valida e normaliza os dados do formulário.
 *
 * Regras de slug: no modo "create", se o campo vier vazio, é gerado a
 * partir de marca + modelo. No modo "edit", o campo já chega pré-preenchido
 * com o slug atual pela página — se vier vazio mesmo assim, é erro (evita
 * regenerar o slug silenciosamente durante uma edição).
 */
function parseProductForm(
  formData: FormData,
  mode: "create" | "edit"
): ParseResult {
  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const skuRaw = String(formData.get("sku") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const availability = String(formData.get("availability") ?? "").trim();
  const warranty = String(formData.get("warranty") ?? "").trim();
  const pickup_available = formData.get("pickup_available") === "on";
  const is_active = formData.get("is_active") === "on";

  if (
    brand.length > 80 ||
    model.length > 120 ||
    (skuRaw && skuRaw.length > 80) ||
    category.length > 80 ||
    description.length > 5000 ||
    availability.length > 80 ||
    warranty.length > 500 ||
    slugInput.length > 160
  ) {
    return { ok: false, error: "field_too_long" };
  }

  if (
    !brand ||
    !model ||
    !category ||
    !description ||
    !priceRaw ||
    !availability ||
    !warranty
  ) {
    return { ok: false, error: "missing_fields" };
  }

  let slugSource = slugInput;
  if (!slugSource && mode === "create") {
    slugSource = `${brand} ${model}`;
  }
  if (!slugSource) {
    return { ok: false, error: "missing_fields" };
  }

  const slug = slugify(slugSource);
  if (!slug) {
    return { ok: false, error: "invalid_slug" };
  }

  const price = Number(priceRaw.replace(",", "."));
  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, error: "invalid_price" };
  }
  // Evita ruido de ponto flutuante antes de enviar para a coluna numeric(10,2).
  const priceRounded = Math.round(price * 100) / 100;

  return {
    ok: true,
    data: {
      brand,
      model,
      slug,
      sku: skuRaw ? skuRaw : null,
      category,
      description,
      price: priceRounded,
      availability,
      warranty,
      pickup_available,
      is_active,
    },
  };
}

/** Traduz um erro do Postgres para um código de erro exibível. */
function mapDbError(error: { code?: string; message: string } | null): string {
  if (!error) return "server_error";
  if (error.code === "23505") {
    if (error.message.includes("products_slug_key")) return "duplicate_slug";
    if (error.message.includes("products_sku_key")) return "duplicate_sku";
    if (error.message.includes("product_colors_product_id_color_key"))
      return "duplicate_color";
    if (error.message.includes("product_specs_product_id_spec_key_key"))
      return "duplicate_spec_key";
  }
  return "server_error";
}

type ColorsParseResult =
  | { ok: true; colors: string[] }
  | { ok: false; error: string };

/** Extrai e valida a lista de cores enviada como JSON num campo escondido. */
function parseColorsInput(formData: FormData): ColorsParseResult {
  const raw = String(formData.get("colors_json") ?? "[]");
  let list: unknown;
  try {
    list = JSON.parse(raw);
  } catch {
    return { ok: false, error: "invalid_colors" };
  }
  if (!Array.isArray(list)) {
    return { ok: false, error: "invalid_colors" };
  }

  const trimmed: string[] = [];
  for (const item of list) {
    if (typeof item !== "string") {
      return { ok: false, error: "invalid_colors" };
    }
    const color = item.trim();
    if (color.length > 80) {
      return { ok: false, error: "field_too_long" };
    }
    if (!color) {
      return { ok: false, error: "empty_color" };
    }
    trimmed.push(color);
  }

  if (new Set(trimmed).size !== trimmed.length) {
    return { ok: false, error: "duplicate_color" };
  }

  return { ok: true, colors: trimmed };
}

type SpecEntry = { key: string; value: string };
type SpecsParseResult =
  | { ok: true; specs: SpecEntry[] }
  | { ok: false; error: string };

/** Extrai e valida a lista de especificações enviada como JSON. */
function parseSpecsInput(formData: FormData): SpecsParseResult {
  const raw = String(formData.get("specs_json") ?? "[]");
  let list: unknown;
  try {
    list = JSON.parse(raw);
  } catch {
    return { ok: false, error: "invalid_specs" };
  }
  if (!Array.isArray(list)) {
    return { ok: false, error: "invalid_specs" };
  }

  const trimmed: SpecEntry[] = [];
  for (const item of list) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as { key?: unknown }).key !== "string" ||
      typeof (item as { value?: unknown }).value !== "string"
    ) {
      return { ok: false, error: "invalid_specs" };
    }
    const key = (item as { key: string }).key.trim();
    const value = (item as { value: string }).value.trim();
    if (key.length > 120 || value.length > 1000) {
      return { ok: false, error: "field_too_long" };
    }
    if (!key) {
      return { ok: false, error: "empty_spec_key" };
    }
    if (!value) {
      return { ok: false, error: "empty_spec_value" };
    }
    trimmed.push({ key, value });
  }

  const keys = trimmed.map((s) => s.key);
  if (new Set(keys).size !== keys.length) {
    return { ok: false, error: "duplicate_spec_key" };
  }

  return { ok: true, specs: trimmed };
}

export async function createProduct(formData: FormData) {
  const adminUserId = await requireAdminSession();

  const parsedProduct = parseProductForm(formData, "create");
  if (!parsedProduct.ok) {
    redirect(`/admin/products/new?error=${parsedProduct.error}`);
  }

  const parsedColors = parseColorsInput(formData);
  if (!parsedColors.ok) {
    redirect(`/admin/products/new?error=${parsedColors.error}`);
  }

  const parsedSpecs = parseSpecsInput(formData);
  if (!parsedSpecs.ok) {
    redirect(`/admin/products/new?error=${parsedSpecs.error}`);
  }

  const admin = createAdminClient();
  const { data: createdProductId, error } = await admin.rpc("admin_create_product_atomic", {
    p_product: parsedProduct.data,
    p_colors: parsedColors.colors,
    p_specs: parsedSpecs.specs,
  });

  if (error) {
    redirect(`/admin/products/new?error=${mapDbError(error)}`);
  }
  await logAdminAction(adminUserId, "product.create", "product", typeof createdProductId === "string" ? createdProductId : undefined, { slug: parsedProduct.data.slug });

  redirect("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  const adminUserId = await requireAdminSession();

  const parsedProduct = parseProductForm(formData, "edit");
  if (!parsedProduct.ok) {
    redirect(`/admin/products/${id}/edit?error=${parsedProduct.error}`);
  }

  const parsedColors = parseColorsInput(formData);
  if (!parsedColors.ok) {
    redirect(`/admin/products/${id}/edit?error=${parsedColors.error}`);
  }

  const parsedSpecs = parseSpecsInput(formData);
  if (!parsedSpecs.ok) {
    redirect(`/admin/products/${id}/edit?error=${parsedSpecs.error}`);
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("admin_update_product_atomic", {
    p_id: id,
    p_product: parsedProduct.data,
    p_colors: parsedColors.colors,
    p_specs: parsedSpecs.specs,
  });

  if (error) {
    const mapped = error.message.includes("product_not_found")
      ? "not_found"
      : mapDbError(error);
    redirect(`/admin/products/${id}/edit?error=${mapped}`);
  }
  await logAdminAction(adminUserId, "product.update", "product", id, { slug: parsedProduct.data.slug });

  redirect("/admin/products");
}

export async function toggleProductActive(id: string, nextValue: boolean) {
  const adminUserId = await requireAdminSession();

  const admin = createAdminClient();
  const { error } = await admin
    .from("products")
    .update({ is_active: nextValue })
    .eq("id", id);

  if (error) {
    redirect("/admin/products?error=server_error");
  }
  await logAdminAction(adminUserId, nextValue ? "product.activate" : "product.deactivate", "product", id);

  redirect("/admin/products");
}
