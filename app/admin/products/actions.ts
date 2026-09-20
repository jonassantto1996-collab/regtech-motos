"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseProductForm, parseColorsInput, parseSpecsInput } from "@/lib/products/validation";

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
