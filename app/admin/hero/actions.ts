"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction, requireAdminSession } from "../products/actions";
import {
  PRODUCT_IMAGES_BUCKET,
  validateImageFile,
  validateImageSignature,
  buildHeroImagePath,
} from "@/lib/supabase/storage";

const HERO_PATH = "/admin/hero";
const HERO_POSITIONS = new Set(["left", "center", "right"]);

function parseImagePosition(formData: FormData) {
  const value = String(formData.get("image_position") ?? "center");
  return HERO_POSITIONS.has(value) ? value : "center";
}

export async function useProductHero(formData: FormData) {
  const adminUserId = await requireAdminSession();
  const rawProductId = String(formData.get("product_id") ?? "").trim();
  const productId = rawProductId || null;
  const imagePosition = parseImagePosition(formData);
  const admin = createAdminClient();

  if (productId) {
    const { data: product } = await admin
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("is_active", true)
      .maybeSingle();
    if (!product) redirect(`${HERO_PATH}?error=invalid_product`);
  }

  const { data: current } = await admin
    .from("home_hero_settings")
    .select("storage_path")
    .eq("id", true)
    .maybeSingle();

  const { error } = await admin
    .from("home_hero_settings")
    .upsert({
      id: true,
      mode: "product",
      product_id: productId,
      storage_path: null,
      alt_text: null,
      image_position: imagePosition,
      updated_at: new Date().toISOString(),
    });

  if (error) redirect(`${HERO_PATH}?error=save_failed`);

  if (current?.storage_path) {
    const { error: removeError } = await admin.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove([current.storage_path]);
    if (removeError) console.error("[useProductHero] Falha ao remover imagem antiga:", removeError);
  }

  await logAdminAction(adminUserId, "hero.use_product", "home_hero", "primary", { product_id: productId, image_position: imagePosition });
  revalidatePath("/");
  revalidatePath(HERO_PATH);
  redirect(`${HERO_PATH}?saved=product`);
}

export async function uploadCustomHero(formData: FormData) {
  const adminUserId = await requireAdminSession();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`${HERO_PATH}?error=missing_file`);
  }

  const validation = validateImageFile({ type: file.type, size: file.size });
  if (!validation.valid) redirect(`${HERO_PATH}?error=invalid_image`);
  const signatureValidation = await validateImageSignature(file);
  if (!signatureValidation.valid) redirect(`${HERO_PATH}?error=invalid_image`);

  const altTextRaw = String(formData.get("alt_text") ?? "").trim();
  const altText = altTextRaw || "Regtech Motors";
  const imagePosition = parseImagePosition(formData);
  const admin = createAdminClient();
  const storagePath = buildHeroImagePath(file.type);

  const { error: uploadError } = await admin.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(storagePath, file, { contentType: file.type });
  if (uploadError) redirect(`${HERO_PATH}?error=upload_failed`);

  const { data: current } = await admin
    .from("home_hero_settings")
    .select("storage_path")
    .eq("id", true)
    .maybeSingle();

  const { error: saveError } = await admin
    .from("home_hero_settings")
    .upsert({
      id: true,
      mode: "custom",
      product_id: null,
      storage_path: storagePath,
      alt_text: altText,
      image_position: imagePosition,
      updated_at: new Date().toISOString(),
    });

  if (saveError) {
    await admin.storage.from(PRODUCT_IMAGES_BUCKET).remove([storagePath]);
    redirect(`${HERO_PATH}?error=save_failed`);
  }

  if (current?.storage_path && current.storage_path !== storagePath) {
    const { error: removeError } = await admin.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove([current.storage_path]);
    if (removeError) console.error("[uploadCustomHero] Falha ao remover imagem antiga:", removeError);
  }

  await logAdminAction(adminUserId, "hero.upload_custom", "home_hero", "primary", { storage_path: storagePath, image_position: imagePosition });
  revalidatePath("/");
  revalidatePath(HERO_PATH);
  redirect(`${HERO_PATH}?saved=custom`);
}
