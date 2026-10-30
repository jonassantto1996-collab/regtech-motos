"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction, requireAdminSession } from "@/app/admin/products/actions";
import { notifyStoreProduct } from "@/lib/cellshop/indexnow";
import {
  PRODUCT_IMAGES_BUCKET,
  buildStoreProductImagePath,
  validateImageFile,
  validateImageSignature,
} from "@/lib/supabase/storage";
import { MAX_IMAGES_PER_PRODUCT } from "@/lib/store/batch-photos";

/**
 * Fotos e ficha técnica dos produtos da loja (Regtech Cell Shop).
 * A primeira foto da ordem é a principal (a que aparece na vitrine).
 */
const MAX_SPECS_PER_PRODUCT = 40;

function editPath(productId: string, error?: string) {
  return `/admin/store/${productId}/edit${error ? `?error=${error}` : ""}#fotos`;
}

async function productExists(productId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("store_products").select("id").eq("id", productId).maybeSingle();
  return Boolean(data);
}

type SaveImagesResult = { ok: true; added: number } | { ok: false; error: string; added: number };

/**
 * Grava as fotos de um produto (Storage primeiro, banco depois), no fim da
 * ordem atual. Usada pelo envio de um produto e pelo envio em lote.
 */
async function saveStoreProductImages(productId: string, files: File[]): Promise<SaveImagesResult> {
  if (!(await productExists(productId))) return { ok: false, error: "not_found", added: 0 };
  if (files.length === 0) return { ok: false, error: "missing_file", added: 0 };

  for (const file of files) {
    if (!validateImageFile(file).valid || !(await validateImageSignature(file)).valid) {
      return { ok: false, error: "invalid_image", added: 0 };
    }
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("store_product_images")
    .select("display_order")
    .eq("product_id", productId)
    .order("display_order", { ascending: false });

  if ((existing?.length ?? 0) + files.length > MAX_IMAGES_PER_PRODUCT) {
    return { ok: false, error: "too_many_images", added: 0 };
  }

  let nextOrder = (existing?.[0]?.display_order ?? -1) + 1;
  let added = 0;
  for (const file of files) {
    const storagePath = buildStoreProductImagePath(productId, file.type);
    const { error: uploadError } = await admin.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(storagePath, file, { contentType: file.type });
    if (uploadError) return { ok: false, error: "upload_failed", added };

    const { error: insertError } = await admin.from("store_product_images").insert({
      product_id: productId,
      storage_path: storagePath,
      display_order: nextOrder,
    });
    if (insertError) {
      // Desfaz o upload que já tinha dado certo para não deixar arquivo solto.
      await admin.storage.from(PRODUCT_IMAGES_BUCKET).remove([storagePath]);
      return { ok: false, error: "upload_failed", added };
    }
    nextOrder += 1;
    added += 1;
  }
  return { ok: true, added };
}

function filesFrom(formData: FormData) {
  return formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
}

/** Envia uma ou mais fotos de uma vez (Storage primeiro, banco depois). */
export async function uploadStoreProductImages(productId: string, formData: FormData) {
  const user = await requireAdminSession();
  const result = await saveStoreProductImages(productId, filesFrom(formData));
  if (!result.ok) redirect(editPath(productId, result.error));

  await logAdminAction(user, "store_product_image.upload", "store_product", productId, { count: result.added });
  notifyStoreProduct(productId);
  redirect(editPath(productId));
}

/**
 * Envio em lote (tela "Enviar fotos em lote"): mesma gravação, mas devolve o
 * resultado em vez de mudar de página, para a tela seguir com o próximo produto.
 */
export async function addStoreProductImagesBatch(productId: string, formData: FormData): Promise<SaveImagesResult> {
  const user = await requireAdminSession();
  const result = await saveStoreProductImages(productId, filesFrom(formData));
  if (result.added > 0) {
    await logAdminAction(user, "store_product_image.batch_upload", "store_product", productId, { count: result.added });
    notifyStoreProduct(productId);
  }
  return result;
}

/** Remove a foto (banco primeiro, depois o arquivo). */
export async function deleteStoreProductImage(imageId: string, productId: string) {
  const user = await requireAdminSession();
  const admin = createAdminClient();
  const { data: image } = await admin
    .from("store_product_images")
    .select("id, product_id, storage_path")
    .eq("id", imageId)
    .maybeSingle();
  if (!image || image.product_id !== productId) redirect(editPath(productId, "image_not_found"));

  const { error } = await admin.from("store_product_images").delete().eq("id", imageId);
  if (error) redirect(editPath(productId, "delete_failed"));

  const { error: storageError } = await admin.storage.from(PRODUCT_IMAGES_BUCKET).remove([image.storage_path]);
  if (storageError) console.error("[store-image] registro apagado, arquivo ficou no Storage:", image.storage_path);

  await logAdminAction(user, "store_product_image.delete", "store_product", productId, { image_id: imageId });
  notifyStoreProduct(productId);
  redirect(editPath(productId));
}

/** Move a foto uma posição para a esquerda/direita. A primeira é a principal. */
export async function moveStoreProductImage(imageId: string, productId: string, direction: "up" | "down") {
  const user = await requireAdminSession();
  const admin = createAdminClient();
  const { data: images } = await admin
    .from("store_product_images")
    .select("id, display_order")
    .eq("product_id", productId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  const list = images ?? [];
  const index = list.findIndex((img) => img.id === imageId);
  const neighborIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1) redirect(editPath(productId, "image_not_found"));
  if (neighborIndex < 0 || neighborIndex >= list.length) redirect(editPath(productId));

  // Renumera a lista inteira já com a troca feita: evita empates de ordem.
  const reordered = [...list];
  [reordered[index], reordered[neighborIndex]] = [reordered[neighborIndex], reordered[index]];
  for (let i = 0; i < reordered.length; i += 1) {
    if (reordered[i].display_order === i) continue;
    const { error } = await admin.from("store_product_images").update({ display_order: i }).eq("id", reordered[i].id);
    if (error) redirect(editPath(productId, "reorder_failed"));
  }

  await logAdminAction(user, "store_product_image.reorder", "store_product", productId, { image_id: imageId, direction });
  notifyStoreProduct(productId);
  redirect(editPath(productId));
}

/** Texto alternativo da foto (acessibilidade e Google Imagens). */
export async function updateStoreImageAltText(imageId: string, productId: string, formData: FormData) {
  await requireAdminSession();
  const raw = String(formData.get("alt_text") ?? "").trim().slice(0, 200);
  const admin = createAdminClient();
  const { error } = await admin
    .from("store_product_images")
    .update({ alt_text: raw || null })
    .eq("id", imageId)
    .eq("product_id", productId);
  if (error) redirect(editPath(productId, "server_error"));
  redirect(editPath(productId));
}

function specsPath(productId: string, error?: string) {
  return `/admin/store/${productId}/edit${error ? `?error=${error}` : ""}#ficha`;
}

/** Adiciona uma linha à ficha técnica. */
export async function addStoreProductSpec(productId: string, formData: FormData) {
  const user = await requireAdminSession();
  const key = String(formData.get("spec_key") ?? "").trim();
  const value = String(formData.get("spec_value") ?? "").trim();
  if (!key || !value || key.length > 80 || value.length > 200) redirect(specsPath(productId, "invalid_spec"));
  if (!(await productExists(productId))) redirect(specsPath(productId, "not_found"));

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("store_product_specs")
    .select("display_order")
    .eq("product_id", productId)
    .order("display_order", { ascending: false });
  if ((existing?.length ?? 0) >= MAX_SPECS_PER_PRODUCT) redirect(specsPath(productId, "too_many_specs"));

  const { error } = await admin.from("store_product_specs").insert({
    product_id: productId,
    spec_key: key,
    spec_value: value,
    display_order: (existing?.[0]?.display_order ?? -1) + 1,
  });
  if (error) redirect(specsPath(productId, "server_error"));
  await logAdminAction(user, "store_product_spec.create", "store_product", productId, { spec_key: key });
  notifyStoreProduct(productId);
  redirect(specsPath(productId));
}

/** Remove uma linha da ficha técnica. */
export async function deleteStoreProductSpec(specId: string, productId: string) {
  const user = await requireAdminSession();
  const admin = createAdminClient();
  const { error } = await admin.from("store_product_specs").delete().eq("id", specId).eq("product_id", productId);
  if (error) redirect(specsPath(productId, "server_error"));
  await logAdminAction(user, "store_product_spec.delete", "store_product", productId, { spec_id: specId });
  notifyStoreProduct(productId);
  redirect(specsPath(productId));
}
