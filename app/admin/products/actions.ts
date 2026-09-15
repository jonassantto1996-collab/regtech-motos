"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Confere se existe uma sessão de admin válida. Nunca confiar em informação
 * vinda do cliente — getClaims() valida o JWT (assinatura + expiração).
 * Redireciona para o login se não houver sessão válida.
 */
async function requireAdminSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    redirect("/admin/login");
  }
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
  // Evita ruído de ponto flutuante antes de enviar para a coluna numeric(10,2).
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
function mapDbError(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    if (error.message.includes("products_slug_key")) return "duplicate_slug";
    if (error.message.includes("products_sku_key")) return "duplicate_sku";
  }
  return "server_error";
}

export async function createProduct(formData: FormData) {
  await requireAdminSession();

  const parsed = parseProductForm(formData, "create");
  if (!parsed.ok) {
    redirect(`/admin/products/new?error=${parsed.error}`);
  }

  const admin = createAdminClient();
  const { error } = await admin.from("products").insert(parsed.data);

  if (error) {
    redirect(`/admin/products/new?error=${mapDbError(error)}`);
  }

  redirect("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdminSession();

  const parsed = parseProductForm(formData, "edit");
  if (!parsed.ok) {
    redirect(`/admin/products/${id}/edit?error=${parsed.error}`);
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("products")
    .update(parsed.data)
    .eq("id", id);

  if (error) {
    redirect(`/admin/products/${id}/edit?error=${mapDbError(error)}`);
  }

  redirect("/admin/products");
}

export async function toggleProductActive(id: string, nextValue: boolean) {
  await requireAdminSession();

  const admin = createAdminClient();
  const { error } = await admin
    .from("products")
    .update({ is_active: nextValue })
    .eq("id", id);

  if (error) {
    redirect("/admin/products?error=server_error");
  }

  redirect("/admin/products");
}
