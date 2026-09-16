"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Confere se existe uma sessão de admin válida. Nunca confiar em informação
 * vinda do cliente — getClaims() valida o JWT (assinatura + expiração).
 * Redireciona para o login se não houver sessão válida.
 */
export async function requireAdminSession() {
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
  await requireAdminSession();

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

  // 1) Cria o produto.
  const { data: product, error: productError } = await admin
    .from("products")
    .insert(parsedProduct.data)
    .select("id")
    .single();

  if (productError || !product) {
    redirect(`/admin/products/new?error=${mapDbError(productError)}`);
  }

  const productId = product.id as string;

  // 2) Cores, se houver. Uma unica instrucao INSERT com varias linhas e
  // atomica no Postgres: ou todas entram, ou nenhuma entra.
  if (parsedColors.colors.length > 0) {
    const { error: colorsError } = await admin
      .from("product_colors")
      .insert(parsedColors.colors.map((color) => ({ product_id: productId, color })));

    if (colorsError) {
      // Rollback compensatorio: nada de cor foi salvo (insert unico falhou
      // por completo), so precisa desfazer o produto.
      await admin.from("products").delete().eq("id", productId);
      redirect(`/admin/products/new?error=${mapDbError(colorsError)}`);
    }
  }

  // 3) Especificacoes, se houver.
  if (parsedSpecs.specs.length > 0) {
    const { error: specsError } = await admin.from("product_specs").insert(
      parsedSpecs.specs.map((s) => ({
        product_id: productId,
        spec_key: s.key,
        spec_value: s.value,
      }))
    );

    if (specsError) {
      // Rollback compensatorio: desfaz cores (se tinham sido salvas) e o produto.
      await admin.from("product_colors").delete().eq("product_id", productId);
      await admin.from("products").delete().eq("id", productId);
      redirect(`/admin/products/new?error=${mapDbError(specsError)}`);
    }
  }

  redirect("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdminSession();

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

  // 1) Atualiza os campos basicos do produto.
  const { error: productError } = await admin
    .from("products")
    .update(parsedProduct.data)
    .eq("id", id);

  if (productError) {
    redirect(`/admin/products/${id}/edit?error=${mapDbError(productError)}`);
  }

  // 2) Sincroniza cores por delta: so mexe no que mudou.
  const { data: currentColorRows, error: readColorsError } = await admin
    .from("product_colors")
    .select("color")
    .eq("product_id", id);

  if (readColorsError) {
    redirect(`/admin/products/${id}/edit?error=sync_failed`);
  }

  const currentColors = (currentColorRows ?? []).map((r) => r.color as string);
  const desiredColors = parsedColors.colors;
  const colorsToRemove = currentColors.filter((c) => !desiredColors.includes(c));
  const colorsToAdd = desiredColors.filter((c) => !currentColors.includes(c));

  if (colorsToRemove.length > 0) {
    const { error } = await admin
      .from("product_colors")
      .delete()
      .eq("product_id", id)
      .in("color", colorsToRemove);
    if (error) {
      redirect(`/admin/products/${id}/edit?error=sync_failed`);
    }
  }

  if (colorsToAdd.length > 0) {
    const { error } = await admin
      .from("product_colors")
      .insert(colorsToAdd.map((color) => ({ product_id: id, color })));
    if (error) {
      redirect(`/admin/products/${id}/edit?error=${mapDbError(error)}`);
    }
  }

  // 3) Sincroniza especificacoes por delta: remove chaves que sairam,
  // insere chaves novas, atualiza valor de chaves que mudaram de valor.
  const { data: currentSpecRows, error: readSpecsError } = await admin
    .from("product_specs")
    .select("spec_key, spec_value")
    .eq("product_id", id);

  if (readSpecsError) {
    redirect(`/admin/products/${id}/edit?error=sync_failed`);
  }

  const currentSpecs = (currentSpecRows ?? []) as {
    spec_key: string;
    spec_value: string;
  }[];
  const desiredSpecs = parsedSpecs.specs;

  const currentKeys = currentSpecs.map((s) => s.spec_key);
  const desiredKeys = desiredSpecs.map((s) => s.key);

  const keysToRemove = currentKeys.filter((k) => !desiredKeys.includes(k));
  const specsToAdd = desiredSpecs.filter((s) => !currentKeys.includes(s.key));
  const specsToUpdate = desiredSpecs.filter((s) => {
    const existing = currentSpecs.find((c) => c.spec_key === s.key);
    return existing !== undefined && existing.spec_value !== s.value;
  });

  if (keysToRemove.length > 0) {
    const { error } = await admin
      .from("product_specs")
      .delete()
      .eq("product_id", id)
      .in("spec_key", keysToRemove);
    if (error) {
      redirect(`/admin/products/${id}/edit?error=sync_failed`);
    }
  }

  if (specsToAdd.length > 0) {
    const { error } = await admin.from("product_specs").insert(
      specsToAdd.map((s) => ({
        product_id: id,
        spec_key: s.key,
        spec_value: s.value,
      }))
    );
    if (error) {
      redirect(`/admin/products/${id}/edit?error=${mapDbError(error)}`);
    }
  }

  for (const s of specsToUpdate) {
    const { error } = await admin
      .from("product_specs")
      .update({ spec_value: s.value })
      .eq("product_id", id)
      .eq("spec_key", s.key);
    if (error) {
      redirect(`/admin/products/${id}/edit?error=sync_failed`);
    }
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
