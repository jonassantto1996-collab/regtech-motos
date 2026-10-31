"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction, requireAdminSession } from "@/app/admin/products/actions";
import {
  PRODUCT_IMAGES_BUCKET,
  buildStoreBannerPath,
  validateImageFile,
  validateImageSignature,
} from "@/lib/supabase/storage";
import { BANNER_DEVICES, MAX_BANNERS, normalizeBannerLink, type BannerDevice } from "@/lib/store/banners";

/**
 * Banners do topo da Regtech Cell Shop (painel → Loja → Banners do topo).
 * Arquivo vai para o Storage primeiro; o registro no banco só depois.
 */
const PAGE = "/admin/store/banners";

export type BannerResult = { ok: true } | { ok: false; error: string };

function size(value: FormDataEntryValue | null): number | null {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 && n <= 20000 ? n : null;
}

function fileFrom(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

async function isValidImage(file: File) {
  return validateImageFile(file).valid && (await validateImageSignature(file)).valid;
}

/** Envia as versões (Storage). Se uma falhar, apaga as que já tinham subido. */
async function uploadVersions(files: Partial<Record<BannerDevice, File>>) {
  const admin = createAdminClient();
  const paths: Partial<Record<BannerDevice, string>> = {};
  for (const device of BANNER_DEVICES) {
    const file = files[device];
    if (!file) continue;
    const path = buildStoreBannerPath(device, file.type);
    const { error } = await admin.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, file, { contentType: file.type });
    if (error) {
      const uploaded = Object.values(paths).filter((p): p is string => Boolean(p));
      if (uploaded.length) await admin.storage.from(PRODUCT_IMAGES_BUCKET).remove(uploaded);
      return null;
    }
    paths[device] = path;
  }
  return paths;
}

/** Cria um banner com as 3 versões (a do computador é obrigatória). */
export async function createStoreBanner(formData: FormData): Promise<BannerResult> {
  const user = await requireAdminSession();
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  if (!title) return { ok: false, error: "Escreva o nome do banner." };
  const rawLink = String(formData.get("link") ?? "").trim();
  const link = normalizeBannerLink(rawLink);
  if (rawLink && !link) return { ok: false, error: "O link não é válido." };

  const files: Partial<Record<BannerDevice, File>> = {};
  for (const device of BANNER_DEVICES) {
    const file = fileFrom(formData, device);
    if (!file) continue;
    if (!(await isValidImage(file))) return { ok: false, error: "Uma das imagens não é JPG, PNG ou WebP válida (até 5 MB)." };
    files[device] = file;
  }
  if (!files.desktop) return { ok: false, error: "Falta a versão do computador." };

  const admin = createAdminClient();
  const { data: existing } = await admin.from("store_banners").select("display_order").order("display_order", { ascending: false });
  if ((existing?.length ?? 0) >= MAX_BANNERS) return { ok: false, error: `O limite é de ${MAX_BANNERS} banners. Exclua um antes.` };

  const paths = await uploadVersions(files);
  if (!paths) return { ok: false, error: "Falha no envio, tente de novo." };

  const { data: created, error } = await admin
    .from("store_banners")
    .insert({
      title,
      link_url: link,
      desktop_path: paths.desktop!,
      desktop_width: size(formData.get("desktop_width")),
      desktop_height: size(formData.get("desktop_height")),
      tablet_path: paths.tablet ?? null,
      tablet_width: paths.tablet ? size(formData.get("tablet_width")) : null,
      tablet_height: paths.tablet ? size(formData.get("tablet_height")) : null,
      mobile_path: paths.mobile ?? null,
      mobile_width: paths.mobile ? size(formData.get("mobile_width")) : null,
      mobile_height: paths.mobile ? size(formData.get("mobile_height")) : null,
      display_order: (existing?.[0]?.display_order ?? -1) + 1,
    })
    .select("id")
    .single();
  if (error || !created) {
    await admin.storage.from(PRODUCT_IMAGES_BUCKET).remove(Object.values(paths).filter((p): p is string => Boolean(p)));
    return { ok: false, error: "Falha ao salvar, tente de novo." };
  }

  await logAdminAction(user, "store_banner.create", "store_banner", created.id, { title });
  return { ok: true };
}

/** Troca a imagem de uma tela de um banner que já existe. */
export async function replaceStoreBannerImage(id: string, device: BannerDevice, formData: FormData): Promise<BannerResult> {
  const user = await requireAdminSession();
  if (!BANNER_DEVICES.includes(device)) return { ok: false, error: "Tela inválida." };
  const file = fileFrom(formData, "file");
  if (!file || !(await isValidImage(file))) return { ok: false, error: "A imagem não é JPG, PNG ou WebP válida (até 5 MB)." };

  const admin = createAdminClient();
  const { data: banner } = await admin.from("store_banners").select("*").eq("id", id).maybeSingle();
  if (!banner) return { ok: false, error: "Banner não encontrado." };

  const paths = await uploadVersions({ [device]: file });
  if (!paths?.[device]) return { ok: false, error: "Falha no envio, tente de novo." };

  const { error } = await admin
    .from("store_banners")
    .update({
      [`${device}_path`]: paths[device],
      [`${device}_width`]: size(formData.get("width")),
      [`${device}_height`]: size(formData.get("height")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    await admin.storage.from(PRODUCT_IMAGES_BUCKET).remove([paths[device]!]);
    return { ok: false, error: "Falha ao salvar, tente de novo." };
  }
  const old = banner[`${device}_path` as const] as string | null;
  if (old) await admin.storage.from(PRODUCT_IMAGES_BUCKET).remove([old]);

  await logAdminAction(user, "store_banner.replace_image", "store_banner", id, { device });
  return { ok: true };
}

/** Tira a versão do tablet ou do celular (o site passa a usar a próxima maior). */
export async function removeStoreBannerImage(id: string, device: BannerDevice) {
  const user = await requireAdminSession();
  if (device === "desktop" || !BANNER_DEVICES.includes(device)) redirect(`${PAGE}?error=1`);
  const admin = createAdminClient();
  const { data: banner } = await admin.from("store_banners").select("*").eq("id", id).maybeSingle();
  if (!banner) redirect(`${PAGE}?error=1`);
  const old = banner[`${device}_path` as const] as string | null;
  const { error } = await admin
    .from("store_banners")
    .update({ [`${device}_path`]: null, [`${device}_width`]: null, [`${device}_height`]: null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) redirect(`${PAGE}?error=1`);
  if (old) await admin.storage.from(PRODUCT_IMAGES_BUCKET).remove([old]);
  await logAdminAction(user, "store_banner.remove_image", "store_banner", id, { device });
  redirect(`${PAGE}?saved=1`);
}

/** Muda o nome e o link. */
export async function updateStoreBanner(id: string, formData: FormData) {
  const user = await requireAdminSession();
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const rawLink = String(formData.get("link") === "__custom" ? formData.get("custom_link") ?? "" : formData.get("link") ?? "").trim();
  const link = normalizeBannerLink(rawLink);
  if (!title || (rawLink && !link)) redirect(`${PAGE}?error=link`);

  const admin = createAdminClient();
  const { error } = await admin
    .from("store_banners")
    .update({ title, link_url: link, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) redirect(`${PAGE}?error=1`);
  await logAdminAction(user, "store_banner.update", "store_banner", id, { title, link });
  redirect(`${PAGE}?saved=1`);
}

/** Mostra / esconde no site. */
export async function toggleStoreBanner(id: string) {
  const user = await requireAdminSession();
  const admin = createAdminClient();
  const { data: banner } = await admin.from("store_banners").select("is_active").eq("id", id).maybeSingle();
  if (!banner) redirect(`${PAGE}?error=1`);
  const { error } = await admin
    .from("store_banners")
    .update({ is_active: !banner.is_active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) redirect(`${PAGE}?error=1`);
  await logAdminAction(user, "store_banner.toggle", "store_banner", id, { is_active: !banner.is_active });
  redirect(`${PAGE}?saved=1`);
}

/** Sobe / desce uma posição na ordem do carrossel. */
export async function moveStoreBanner(id: string, direction: "up" | "down") {
  const user = await requireAdminSession();
  const admin = createAdminClient();
  const { data: banners } = await admin.from("store_banners").select("id,display_order").order("display_order").order("created_at");
  const list = banners ?? [];
  const index = list.findIndex((b) => b.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= list.length) redirect(PAGE);

  const reordered = [...list];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  for (let i = 0; i < reordered.length; i += 1) {
    if (reordered[i].display_order !== i) {
      const { error } = await admin.from("store_banners").update({ display_order: i }).eq("id", reordered[i].id);
      if (error) redirect(`${PAGE}?error=1`);
    }
  }
  await logAdminAction(user, "store_banner.move", "store_banner", id, { direction });
  redirect(`${PAGE}?saved=1`);
}

/** Exclui o banner (banco primeiro, depois os arquivos). */
export async function deleteStoreBanner(id: string) {
  const user = await requireAdminSession();
  const admin = createAdminClient();
  const { data: banner } = await admin.from("store_banners").select("*").eq("id", id).maybeSingle();
  if (!banner) redirect(`${PAGE}?error=1`);
  const { error } = await admin.from("store_banners").delete().eq("id", id);
  if (error) redirect(`${PAGE}?error=1`);
  const files = [banner.desktop_path, banner.tablet_path, banner.mobile_path].filter((p): p is string => Boolean(p));
  const { error: storageError } = await admin.storage.from(PRODUCT_IMAGES_BUCKET).remove(files);
  if (storageError) console.error("[store-banner] registro apagado, arquivos ficaram no Storage:", files);
  await logAdminAction(user, "store_banner.delete", "store_banner", id, { title: banner.title });
  redirect(`${PAGE}?saved=deleted`);
}
