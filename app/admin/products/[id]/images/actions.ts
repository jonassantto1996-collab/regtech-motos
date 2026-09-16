"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "../../actions";
import {
  PRODUCT_IMAGES_BUCKET,
  validateImageFile,
  buildProductImagePath,
} from "@/lib/supabase/storage";

function editPath(productId: string): string {
  return `/admin/products/${productId}/edit`;
}

/**
 * Envia uma nova imagem para o produto.
 *
 * Ordem: Storage primeiro, banco depois. Se o registro em `product_images`
 * falhar depois do upload já ter dado certo, o arquivo recém-enviado é
 * apagado do Storage (rollback compensatório) — evita deixar um arquivo
 * órfão referenciável por engano.
 */
export async function uploadProductImage(
  productId: string,
  formData: FormData
) {
  await requireAdminSession();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`${editPath(productId)}?error=missing_file`);
  }

  const validation = validateImageFile({
    type: (file as File).type,
    size: (file as File).size,
  });
  if (!validation.valid) {
    redirect(`${editPath(productId)}?error=invalid_image`);
  }

  const admin = createAdminClient();

  const { data: product, error: productError } = await admin
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();

  if (productError || !product) {
    redirect(`${editPath(productId)}?error=not_found`);
  }

  const storagePath = buildProductImagePath(productId, (file as File).type);

  const { error: uploadError } = await admin.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(storagePath, file as File, { contentType: (file as File).type });

  if (uploadError) {
    redirect(`${editPath(productId)}?error=upload_failed`);
  }

  const { count: existingCount } = await admin
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const { data: maxOrderRow } = await admin
    .from("product_images")
    .select("display_order")
    .eq("product_id", productId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxOrderRow?.display_order ?? -1) + 1;
  const isFirstImage = (existingCount ?? 0) === 0;

  const { error: insertError } = await admin.from("product_images").insert({
    product_id: productId,
    storage_path: storagePath,
    display_order: nextOrder,
    is_main: isFirstImage,
    alt_text: null,
  });

  if (insertError) {
    // Rollback compensatório: desfaz o upload que já tinha dado certo.
    await admin.storage.from(PRODUCT_IMAGES_BUCKET).remove([storagePath]);
    redirect(`${editPath(productId)}?error=upload_failed`);
  }

  revalidatePath(editPath(productId));
  redirect(editPath(productId));
}

/**
 * Remove uma imagem do produto.
 *
 * Ordem: banco primeiro, Storage depois. Se o Storage falhar depois do
 * registro já ter sido apagado, sobra um arquivo órfão no bucket — baixa
 * gravidade, nada mais referencia esse arquivo. A ordem inversa deixaria
 * um registro fantasma apontando pra um arquivo inexistente (quebra a
 * tela e pode travar a troca de imagem principal), por isso foi descartada.
 */
export async function deleteProductImage(imageId: string, productId: string) {
  await requireAdminSession();
  const admin = createAdminClient();

  const { data: image, error: fetchError } = await admin
    .from("product_images")
    .select("id, product_id, storage_path")
    .eq("id", imageId)
    .maybeSingle();

  if (fetchError || !image || image.product_id !== productId) {
    redirect(`${editPath(productId)}?error=image_not_found`);
  }

  const { error: deleteDbError } = await admin
    .from("product_images")
    .delete()
    .eq("id", imageId);

  if (deleteDbError) {
    redirect(`${editPath(productId)}?error=delete_failed`);
  }

  const { error: deleteStorageError } = await admin.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([(image as { storage_path: string }).storage_path]);

  if (deleteStorageError) {
    console.error(
      `[deleteProductImage] Registro removido do banco, mas falha ao apagar arquivo do Storage. ` +
        `product_id=${productId} imagem=${imageId} storage_path=${
          (image as { storage_path: string }).storage_path
        } erro=${JSON.stringify(deleteStorageError)}`
    );
    // Não bloqueia o fluxo: arquivo órfão é um risco de baixa gravidade,
    // já documentado e aceito na análise da etapa.
  }

  revalidatePath(editPath(productId));
  redirect(editPath(productId));
}

/**
 * Define uma imagem como principal.
 *
 * Passo 1: desliga a principal atual (se existir).
 * Passo 2: liga a nova.
 * Se o passo 2 falhar depois do passo 1 ter dado certo, tenta restaurar a
 * principal anterior (compensação). Se a compensação também falhar, o erro
 * é reportado explicitamente ao admin (nunca escondido) e detalhado no log
 * do servidor com todos os IDs envolvidos, para diagnóstico manual.
 */
export async function setMainProductImage(
  imageId: string,
  productId: string
) {
  await requireAdminSession();
  const admin = createAdminClient();

  const { data: targetImage, error: fetchError } = await admin
    .from("product_images")
    .select("id, product_id, is_main")
    .eq("id", imageId)
    .maybeSingle();

  if (fetchError || !targetImage || targetImage.product_id !== productId) {
    redirect(`${editPath(productId)}?error=image_not_found`);
  }

  if ((targetImage as { is_main: boolean }).is_main) {
    // Já é a principal — nada a fazer.
    redirect(editPath(productId));
  }

  const { data: currentMain } = await admin
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .eq("is_main", true)
    .maybeSingle();

  const previousMainId = currentMain?.id ?? null;

  if (previousMainId) {
    const { error: unsetError } = await admin
      .from("product_images")
      .update({ is_main: false })
      .eq("id", previousMainId);

    if (unsetError) {
      // Nada mudou de fato (a atualização em si falhou) — reporta e para.
      redirect(`${editPath(productId)}?error=main_image_switch_failed`);
    }
  }

  const { error: setError } = await admin
    .from("product_images")
    .update({ is_main: true })
    .eq("id", imageId);

  if (setError) {
    if (previousMainId) {
      const { error: restoreError } = await admin
        .from("product_images")
        .update({ is_main: true })
        .eq("id", previousMainId);

      if (restoreError) {
        console.error(
          `[setMainProductImage] FALHA CRÍTICA: não foi possível trocar nem restaurar a imagem principal. ` +
            `product_id=${productId} imagem_alvo=${imageId} imagem_anterior=${previousMainId} ` +
            `erro_troca=${JSON.stringify(setError)} erro_restauracao=${JSON.stringify(
              restoreError
            )}`
        );
        redirect(`${editPath(productId)}?error=main_image_switch_critical`);
      }
    }
    redirect(`${editPath(productId)}?error=main_image_switch_failed`);
  }

  revalidatePath(editPath(productId));
  redirect(editPath(productId));
}

/** Troca a ordem de exibição entre uma imagem e sua vizinha imediata. */
async function swapDisplayOrder(
  productId: string,
  imageId: string,
  direction: "up" | "down"
) {
  await requireAdminSession();
  const admin = createAdminClient();

  const { data: images, error } = await admin
    .from("product_images")
    .select("id, display_order")
    .eq("product_id", productId)
    .order("display_order", { ascending: true });

  if (error || !images) {
    redirect(`${editPath(productId)}?error=reorder_failed`);
  }

  const list = images as { id: string; display_order: number }[];
  const index = list.findIndex((img) => img.id === imageId);
  if (index === -1) {
    redirect(`${editPath(productId)}?error=image_not_found`);
  }

  const neighborIndex = direction === "up" ? index - 1 : index + 1;
  if (neighborIndex < 0 || neighborIndex >= list.length) {
    // Já está na ponta — nada a fazer.
    redirect(editPath(productId));
  }

  const current = list[index];
  const neighbor = list[neighborIndex];

  const { error: error1 } = await admin
    .from("product_images")
    .update({ display_order: neighbor.display_order })
    .eq("id", current.id);

  if (error1) {
    redirect(`${editPath(productId)}?error=reorder_failed`);
  }

  const { error: error2 } = await admin
    .from("product_images")
    .update({ display_order: current.display_order })
    .eq("id", neighbor.id);

  if (error2) {
    // Desfaz o passo anterior para não deixar duas imagens com a mesma ordem.
    await admin
      .from("product_images")
      .update({ display_order: current.display_order })
      .eq("id", current.id);
    redirect(`${editPath(productId)}?error=reorder_failed`);
  }

  revalidatePath(editPath(productId));
  redirect(editPath(productId));
}

export async function moveImageUp(imageId: string, productId: string) {
  await swapDisplayOrder(productId, imageId, "up");
}

export async function moveImageDown(imageId: string, productId: string) {
  await swapDisplayOrder(productId, imageId, "down");
}

/** Atualiza o texto alternativo de uma imagem. Campo vazio vira null. */
export async function updateImageAltText(
  imageId: string,
  productId: string,
  formData: FormData
) {
  await requireAdminSession();
  const admin = createAdminClient();

  const { data: image, error: fetchError } = await admin
    .from("product_images")
    .select("id, product_id")
    .eq("id", imageId)
    .maybeSingle();

  if (fetchError || !image || image.product_id !== productId) {
    redirect(`${editPath(productId)}?error=image_not_found`);
  }

  const raw = String(formData.get("alt_text") ?? "").trim();
  const altText = raw ? raw : null;

  const { error: updateError } = await admin
    .from("product_images")
    .update({ alt_text: altText })
    .eq("id", imageId);

  if (updateError) {
    redirect(`${editPath(productId)}?error=alt_text_update_failed`);
  }

  revalidatePath(editPath(productId));
  redirect(editPath(productId));
}
