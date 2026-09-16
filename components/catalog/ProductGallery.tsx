"use client";

import { useState } from "react";
import Image from "next/image";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { CatalogProductImage } from "@/lib/catalog/queries";

type Props = {
  images: CatalogProductImage[];
  productName: string;
};

/**
 * As imagens já chegam ordenadas por display_order (consulta com
 * referencedTable). A imagem principal (is_main = true) começa selecionada.
 * Sem nenhuma imagem, mostra um placeholder visual — nunca um registro
 * fictício no banco.
 */
export default function ProductGallery({ images, productName }: Props) {
  const mainImage = images.find((img) => img.is_main) ?? images[0] ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(
    mainImage?.id ?? null
  );

  const selected =
    images.find((img) => img.id === selectedId) ?? mainImage;

  if (!selected) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-gray-100 text-gray-400">
        Sem imagem disponível
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={getPublicImageUrl(selected.storage_path)}
          alt={selected.alt_text || productName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedId(img.id)}
              aria-label={`Ver imagem ${img.display_order + 1} de ${productName}`}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border-2 ${
                img.id === selected.id
                  ? "border-gray-900"
                  : "border-transparent"
              }`}
            >
              <Image
                src={getPublicImageUrl(img.storage_path)}
                alt={img.alt_text || productName}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
