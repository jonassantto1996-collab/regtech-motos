/**
 * Utilitários para o bucket de imagens de produtos no Supabase Storage
 * (bucket: product-images).
 *
 * Nenhuma função aqui usa SUPABASE_SERVICE_ROLE_KEY — são seguras para uso
 * em Client Components ou Server Components/Actions.
 *
 * Upload e remoção reais de arquivos são feitos em Server Actions (ver
 * app/admin/products/[id]/images/actions.ts), que validam a sessão de
 * administrador (requireAdminSession) antes de usar o service_role.
 */

export const PRODUCT_IMAGES_BUCKET = "product-images";

// Espelha exatamente a configuração aplicada em storage.buckets (migration
// create_product_images_bucket). Mudar aqui não muda o banco — os dois
// precisam ser atualizados juntos se o limite ou os formatos mudarem.
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ImageValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * Valida um arquivo antes do upload (tipo MIME e tamanho).
 * Não confia apenas na extensão do nome do arquivo original.
 */
export function validateImageFile(file: {
  type: string;
  size: number;
}): ImageValidationResult {
  if (
    !ALLOWED_IMAGE_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number]
    )
  ) {
    return {
      valid: false,
      reason: `Formato não permitido: ${file.type}. Use JPEG, PNG ou WebP.`,
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      reason: `Arquivo maior que o limite de ${
        MAX_IMAGE_SIZE_BYTES / 1024 / 1024
      }MB.`,
    };
  }

  return { valid: true };
}

/**
 * Gera o caminho de armazenamento para uma nova imagem de produto:
 * products/{productId}/{uuid}.{extensão}
 *
 * O nome do arquivo é sempre gerado (nunca o nome original enviado pelo
 * usuário), evitando colisões e nomes problemáticos.
 */
export function buildProductImagePath(
  productId: string,
  mimeType: string
): string {
  const extension = MIME_TO_EXTENSION[mimeType] ?? "bin";
  const fileName = `${crypto.randomUUID()}.${extension}`;
  return `products/${productId}/${fileName}`;
}

/**
 * Converte um storage_path em URL pública utilizável pelo frontend.
 * O bucket product-images é público — nenhuma credencial é necessária
 * para montar ou acessar essa URL.
 */
export function getPublicImageUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${storagePath}`;
}
