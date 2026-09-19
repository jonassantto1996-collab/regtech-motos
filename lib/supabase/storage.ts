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


/** Gera um caminho isolado para uma imagem exclusiva do Hero da Home. */
export function buildHeroImagePath(mimeType: string): string {
  const extension = MIME_TO_EXTENSION[mimeType] ?? "bin";
  return `home-hero/${crypto.randomUUID()}.${extension}`;
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


/**
 * Defesa adicional server-side: confirma a assinatura binária real do arquivo.
 * O MIME enviado pelo navegador não é uma fronteira de segurança.
 */
export async function validateImageSignature(file: File): Promise<ImageValidationResult> {
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng = header.length >= 8 &&
    header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47 &&
    header[4] === 0x0d && header[5] === 0x0a && header[6] === 0x1a && header[7] === 0x0a;
  const isWebp = header.length >= 12 &&
    header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
    header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50;

  const matches =
    (file.type === "image/jpeg" && isJpeg) ||
    (file.type === "image/png" && isPng) ||
    (file.type === "image/webp" && isWebp);

  return matches
    ? { valid: true }
    : { valid: false, reason: "O conteúdo do arquivo não corresponde ao formato de imagem declarado." };
}
