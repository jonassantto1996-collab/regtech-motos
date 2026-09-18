"use client";

import { useState } from "react";
import Image from "next/image";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { CatalogProductImage } from "@/lib/catalog/queries";

type Props = {
  images: CatalogProductImage[];
  productName: string;
};

export default function ProductGallery({ images, productName }: Props) {
  const mainImage = images.find((img) => img.is_main) ?? images[0] ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(
    mainImage?.id ?? null
  );

  const selected = images.find((img) => img.id === selectedId) ?? mainImage;

  if (!selected) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-gray-100 text-sm text-gray-400">
        Sem imagem disponível
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 sm:aspect-[4/3]">
        <Image
          src={getPublicImageUrl(selected.storage_path)}
          alt={selected.alt_text || productName}
          fill
          className="object-contain p-3 sm:p-8"
          sizes="(max-width: 1024px) 100vw, 58vw"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex snap-x gap-2.5 overflow-x-auto pb-1 sm:mt-4 sm:gap-3">
          {images.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedId(img.id)}
              aria-label={`Ver imagem ${index + 1} de ${productName}`}
              aria-pressed={img.id === selected.id}
              className={`relative aspect-[4/3] w-20 flex-shrink-0 snap-start overflow-hidden border-b-2 bg-gray-50 transition-colors sm:w-28 ${
                img.id === selected.id
                  ? "border-blue-700"
                  : "border-transparent hover:border-gray-400"
              }`}
            >
              <Image
                src={getPublicImageUrl(img.storage_path)}
                alt={img.alt_text || productName}
                fill
                className="object-contain p-2"
                sizes="112px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
