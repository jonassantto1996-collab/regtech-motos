"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction, requireAdminSession } from "../products/actions";
import {
  PRODUCT_IMAGES_BUCKET,
  buildSocialProofImagePath,
  validateImageFile,
  validateImageSignature,
} from "@/lib/supabase/storage";

const PATH = "/admin/social-proof";

function parseText(formData: FormData, key: string, max: number, required = false) {
  const value = String(formData.get(key) ?? "").trim();
  if (required && !value) return { ok: false as const, error: "missing_fields" };
  if (value.length > max) return { ok: false as const, error: "field_too_long" };
  return { ok: true as const, value: value || null };
}

function parseSortOrder(formData: FormData) {
  const raw = String(formData.get("sort_order") ?? "0").trim();
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 && value <= 999 ? value : null;
}

export async function createSocialProof(formData: FormData) {
  const userId = await requireAdminSession();
  const name = parseText(formData, "customer_name", 100, true);
  const city = parseText(formData, "city", 100);
  const product = parseText(formData, "product_name", 120);
  const testimonial = parseText(formData, "testimonial", 400);
  const alt = parseText(formData, "alt_text", 180, true);
  const sortOrder = parseSortOrder(formData);
  if (!name.ok || !city.ok || !product.ok || !testimonial.ok || !alt.ok || sortOrder === null) {
    redirect(PATH + "?error=invalid_fields");
  }

  const authorized = formData.get("publication_authorized") === "on";
  const active = formData.get("is_active") === "on";
  if (active && !authorized) redirect(PATH + "?error=authorization_required");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) redirect(PATH + "?error=missing_file");
  const validation = validateImageFile({ type: file.type, size: file.size });
  if (!validation.valid) redirect(PATH + "?error=invalid_image");
  const signature = await validateImageSignature(file);
  if (!signature.valid) redirect(PATH + "?error=invalid_image");

  const admin = createAdminClient();
  const storagePath = buildSocialProofImagePath(file.type);
  const { error: uploadError } = await admin.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(storagePath, file, { contentType: file.type });
  if (uploadError) redirect(PATH + "?error=upload_failed");

  const { data: row, error } = await admin
    .from("home_social_proof")
    .insert({
      customer_name: name.value,
      city: city.value,
      product_name: product.value,
      testimonial: testimonial.value,
      storage_path: storagePath,
      alt_text: alt.value,
      sort_order: sortOrder,
      publication_authorized: authorized,
      is_active: active,
    })
    .select("id")
    .single();

  if (error || !row) {
    await admin.storage.from(PRODUCT_IMAGES_BUCKET).remove([storagePath]);
    redirect(PATH + "?error=save_failed");
  }

  await logAdminAction(userId, "social_proof.create", "home_social_proof", row.id, { active, sort_order: sortOrder });
  revalidatePath("/");
  redirect(PATH + "?saved=create");
}

export async function updateSocialProof(id: string, formData: FormData) {
  const userId = await requireAdminSession();
  const name = parseText(formData, "customer_name", 100, true);
  const city = parseText(formData, "city", 100);
  const product = parseText(formData, "product_name", 120);
  const testimonial = parseText(formData, "testimonial", 400);
  const alt = parseText(formData, "alt_text", 180, true);
  const sortOrder = parseSortOrder(formData);
  if (!name.ok || !city.ok || !product.ok || !testimonial.ok || !alt.ok || sortOrder === null) {
    redirect(PATH + "?error=invalid_fields");
  }

  const authorized = formData.get("publication_authorized") === "on";
  const active = formData.get("is_active") === "on";
  if (active && !authorized) redirect(PATH + "?error=authorization_required");

  const admin = createAdminClient();
  const { data: current } = await admin
    .from("home_social_proof")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!current) redirect(PATH + "?error=not_found");

  let storagePath = current.storage_path;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const validation = validateImageFile({ type: file.type, size: file.size });
    if (!validation.valid) redirect(PATH + "?error=invalid_image");
    const signature = await validateImageSignature(file);
    if (!signature.valid) redirect(PATH + "?error=invalid_image");

    const nextPath = buildSocialProofImagePath(file.type);
    const { error: uploadError } = await admin.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(nextPath, file, { contentType: file.type });
    if (uploadError) redirect(PATH + "?error=upload_failed");
    storagePath = nextPath;
  }

  const { error } = await admin
    .from("home_social_proof")
    .update({
      customer_name: name.value,
      city: city.value,
      product_name: product.value,
      testimonial: testimonial.value,
      storage_path: storagePath,
      alt_text: alt.value,
      sort_order: sortOrder,
      publication_authorized: authorized,
      is_active: active,
    })
    .eq("id", id);

  if (error) {
    if (storagePath !== current.storage_path) {
      await admin.storage.from(PRODUCT_IMAGES_BUCKET).remove([storagePath]);
    }
    redirect(PATH + "?error=save_failed");
  }

  if (storagePath !== current.storage_path) {
    await admin.storage.from(PRODUCT_IMAGES_BUCKET).remove([current.storage_path]);
  }

  await logAdminAction(userId, "social_proof.update", "home_social_proof", id, { active, sort_order: sortOrder });
  revalidatePath("/");
  redirect(PATH + "?saved=update");
}

export async function deleteSocialProof(id: string) {
  const userId = await requireAdminSession();
  const admin = createAdminClient();
  const { data: current } = await admin
    .from("home_social_proof")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!current) redirect(PATH + "?error=not_found");

  const { error } = await admin.from("home_social_proof").delete().eq("id", id);
  if (error) redirect(PATH + "?error=save_failed");

  const { error: removeError } = await admin.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([current.storage_path]);
  if (removeError) console.error("[social-proof] Falha ao remover imagem:", removeError);

  await logAdminAction(userId, "social_proof.delete", "home_social_proof", id);
  revalidatePath("/");
  redirect(PATH + "?saved=delete");
}
