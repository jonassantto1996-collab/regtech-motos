"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction, requireAdminSession } from "../products/actions";
import {
  HOME_MEDIA_BUCKET,
  buildHomeEditorialImagePath,
  validateHomeMediaFile,
  validateImageSignature,
} from "@/lib/supabase/storage";
import { readImageDimensions } from "@/lib/images/dimensions";

const PATH = "/admin/editorial";
const POSITIONS = new Set(["left", "center", "right"]);

function requiredText(formData: FormData, key: string, max: number) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value || value.length > max) return null;
  return value;
}

export async function saveHomeEditorial(formData: FormData) {
  const userId = await requireAdminSession();

  const eyebrow = requiredText(formData, "eyebrow", 80);
  const title = requiredText(formData, "title", 180);
  const description = requiredText(formData, "description", 500);
  const ctaLabel = requiredText(formData, "cta_label", 60);
  const ctaHref = requiredText(formData, "cta_href", 300);
  const altText = requiredText(formData, "alt_text", 180);
  const imagePosition = String(formData.get("image_position") ?? "center");
  const imagePositionX = Number(String(formData.get("image_position_x") ?? "50"));
  const imagePositionY = Number(String(formData.get("image_position_y") ?? "50"));
  const isActive = formData.get("is_active") === "on";

  if (
    !eyebrow || !title || !description || !ctaLabel || !ctaHref || !altText ||
    !POSITIONS.has(imagePosition) ||
    !Number.isInteger(imagePositionX) || imagePositionX < 0 || imagePositionX > 100 ||
    !Number.isInteger(imagePositionY) || imagePositionY < 0 || imagePositionY > 100
  ) {
    redirect(PATH + "?error=invalid_fields");
  }
  if (!ctaHref.startsWith("/")) redirect(PATH + "?error=invalid_link");

  const admin = createAdminClient();
  const { data: current } = await admin
    .from("home_editorial_settings")
    .select("storage_path,image_width,image_height")
    .eq("id", true)
    .maybeSingle();

  let storagePath = current?.storage_path ?? null;
  let imageWidth = current?.image_width ?? null;
  let imageHeight = current?.image_height ?? null;
  const file = formData.get("file");

  if (file instanceof File && file.size > 0) {
    const validation = validateHomeMediaFile({ type: file.type, size: file.size });
    if (!validation.valid) redirect(PATH + "?error=invalid_image");

    const signature = await validateImageSignature(file);
    if (!signature.valid) redirect(PATH + "?error=invalid_image");

    const dimensions = await readImageDimensions(file);

    const nextPath = buildHomeEditorialImagePath(file.type);
    const { error: uploadError } = await admin.storage
      .from(HOME_MEDIA_BUCKET)
      .upload(nextPath, file, {
        contentType: file.type,
        cacheControl: "31536000",
      });

    if (uploadError) redirect(PATH + "?error=upload_failed");

    storagePath = nextPath;
    imageWidth = dimensions?.width ?? null;
    imageHeight = dimensions?.height ?? null;
  }

  const { error } = await admin
    .from("home_editorial_settings")
    .upsert({
      id: true,
      eyebrow,
      title,
      description,
      cta_label: ctaLabel,
      cta_href: ctaHref,
      storage_path: storagePath,
      alt_text: altText,
      image_position: imagePosition,
      image_position_x: imagePositionX,
      image_position_y: imagePositionY,
      is_active: isActive,
      image_width: imageWidth,
      image_height: imageHeight,
    });

  if (error) {
    if (storagePath && storagePath !== current?.storage_path) {
      await admin.storage.from(HOME_MEDIA_BUCKET).remove([storagePath]);
    }
    redirect(PATH + "?error=save_failed");
  }

  if (current?.storage_path && storagePath !== current.storage_path) {
    const { error: removeError } = await admin.storage
      .from(HOME_MEDIA_BUCKET)
      .remove([current.storage_path]);
    if (removeError) console.error("[editorial] Falha ao remover mídia anterior:", removeError);
  }

  await logAdminAction(userId, "home_editorial.update", "home_editorial", "primary", {
    is_active: isActive,
    storage_path: storagePath,
    image_width: imageWidth,
    image_height: imageHeight,
    image_position_x: imagePositionX,
    image_position_y: imagePositionY,
  });

  revalidatePath("/");
  revalidatePath(PATH);
  redirect(PATH + "?saved=1");
}
