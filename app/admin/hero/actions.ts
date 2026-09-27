"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction, requireAdminSession } from "../products/actions";
import {
  HOME_MEDIA_BUCKET,
  PRODUCT_IMAGES_BUCKET,
  validateImageFile,
  validateImageSignature,
  buildHeroImagePath,
  buildHeroVideoPath,
  type HeroVideoViewport,
} from "@/lib/supabase/storage";

const HERO_PATH = "/admin/hero";
const HERO_POSITIONS = new Set(["left", "center", "right"]);
const VIDEO_PREFIXES: Record<HeroVideoViewport, string> = {
  desktop: "home-hero/video/desktop/",
  tablet: "home-hero/video/tablet/",
  mobile: "home-hero/video/mobile/",
};

type CurrentHeroMedia = {
  storage_path: string | null;
  video_desktop_path: string | null;
  video_tablet_path: string | null;
  video_mobile_path: string | null;
};

type HeroVideoPaths = Record<HeroVideoViewport, string>;

function parseImagePosition(formData: FormData) {
  const value = String(formData.get("image_position") ?? "center");
  return HERO_POSITIONS.has(value) ? value : "center";
}

function isExpectedVideoPath(viewport: HeroVideoViewport, path: string) {
  return (
    path.startsWith(VIDEO_PREFIXES[viewport]) &&
    path.endsWith(".mp4") &&
    !path.includes("..")
  );
}

async function getCurrentHeroMedia(): Promise<CurrentHeroMedia | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("home_hero_settings")
    .select("storage_path, video_desktop_path, video_tablet_path, video_mobile_path")
    .eq("id", true)
    .maybeSingle();
  return data;
}

async function removePreviousMedia(current: CurrentHeroMedia | null, keepImagePath?: string) {
  if (!current) return;
  const admin = createAdminClient();

  if (current.storage_path && current.storage_path !== keepImagePath) {
    const { error } = await admin.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove([current.storage_path]);
    if (error) console.error("[hero] Falha ao remover imagem antiga:", error);
  }

  const oldVideos = [
    current.video_desktop_path,
    current.video_tablet_path,
    current.video_mobile_path,
  ].filter((path): path is string => Boolean(path));

  if (oldVideos.length) {
    const { error } = await admin.storage.from(HOME_MEDIA_BUCKET).remove(oldVideos);
    if (error) console.error("[hero] Falha ao remover vídeos antigos:", error);
  }
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

  const current = await getCurrentHeroMedia();

  const { error } = await admin
    .from("home_hero_settings")
    .upsert({
      id: true,
      mode: "product",
      product_id: productId,
      storage_path: null,
      alt_text: null,
      image_position: imagePosition,
      video_desktop_path: null,
      video_tablet_path: null,
      video_mobile_path: null,
      updated_at: new Date().toISOString(),
    });

  if (error) redirect(`${HERO_PATH}?error=save_failed`);

  await removePreviousMedia(current);
  await logAdminAction(adminUserId, "hero.use_product", "home_hero", "primary", {
    product_id: productId,
    image_position: imagePosition,
  });
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

  const current = await getCurrentHeroMedia();

  const { error: saveError } = await admin
    .from("home_hero_settings")
    .upsert({
      id: true,
      mode: "custom",
      product_id: null,
      storage_path: storagePath,
      alt_text: altText,
      image_position: imagePosition,
      video_desktop_path: null,
      video_tablet_path: null,
      video_mobile_path: null,
      updated_at: new Date().toISOString(),
    });

  if (saveError) {
    await admin.storage.from(PRODUCT_IMAGES_BUCKET).remove([storagePath]);
    redirect(`${HERO_PATH}?error=save_failed`);
  }

  await removePreviousMedia(current, storagePath);
  await logAdminAction(adminUserId, "hero.upload_custom", "home_hero", "primary", {
    storage_path: storagePath,
    image_position: imagePosition,
  });
  revalidatePath("/");
  revalidatePath(HERO_PATH);
  redirect(`${HERO_PATH}?saved=custom`);
}

export async function prepareHeroVideoUploads() {
  await requireAdminSession();
  const admin = createAdminClient();
  const viewports: HeroVideoViewport[] = ["desktop", "tablet", "mobile"];
  const uploads = {} as Record<HeroVideoViewport, { path: string; token: string }>;

  for (const viewport of viewports) {
    const path = buildHeroVideoPath(viewport);
    const { data, error } = await admin.storage
      .from(HOME_MEDIA_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data?.token) {
      console.error(`[prepareHeroVideoUploads] Falha em ${viewport}:`, error);
      return { ok: false as const, error: "signed_url_failed" };
    }

    uploads[viewport] = { path, token: data.token };
  }

  return { ok: true as const, uploads };
}

export async function cleanupHeroVideoUploads(paths: string[]) {
  await requireAdminSession();
  const safePaths = paths.filter((path) =>
    (Object.keys(VIDEO_PREFIXES) as HeroVideoViewport[]).some((viewport) =>
      isExpectedVideoPath(viewport, path)
    )
  );

  if (!safePaths.length) return;
  const admin = createAdminClient();
  const { error } = await admin.storage.from(HOME_MEDIA_BUCKET).remove(safePaths);
  if (error) console.error("[cleanupHeroVideoUploads] Falha ao limpar uploads:", error);
}

export async function finalizeHeroVideoUploads(paths: HeroVideoPaths) {
  const adminUserId = await requireAdminSession();

  for (const viewport of Object.keys(VIDEO_PREFIXES) as HeroVideoViewport[]) {
    if (!isExpectedVideoPath(viewport, paths[viewport])) {
      return { ok: false as const, error: "invalid_video_path" };
    }
  }

  const admin = createAdminClient();
  const current = await getCurrentHeroMedia();

  const { error: saveError } = await admin
    .from("home_hero_settings")
    .upsert({
      id: true,
      mode: "video",
      product_id: null,
      storage_path: null,
      alt_text: "Vídeo institucional Regtech Motors",
      image_position: "center",
      video_desktop_path: paths.desktop,
      video_tablet_path: paths.tablet,
      video_mobile_path: paths.mobile,
      updated_at: new Date().toISOString(),
    });

  if (saveError) {
    console.error("[finalizeHeroVideoUploads] Falha ao salvar configuração:", saveError);
    return { ok: false as const, error: "save_failed" };
  }

  await removePreviousMedia(current);
  await logAdminAction(adminUserId, "hero.upload_video", "home_hero", "primary", {
    desktop_path: paths.desktop,
    tablet_path: paths.tablet,
    mobile_path: paths.mobile,
  });
  revalidatePath("/");
  revalidatePath(HERO_PATH);

  return { ok: true as const };
}
