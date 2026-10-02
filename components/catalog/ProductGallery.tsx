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
      <div className="flex aspect-square w-full items-center justify-center bg-[#f4f6f8] text-sm text-gray-400">
        Sem imagem disponível
      </div>
    );
  }

  const selectedUrl = getPublicImageUrl(selected.storage_path);

  return (
    <div>
      <div className="relative isolate aspect-[4/3] w-full overflow-hidden bg-[#0f172a]">
        {/* Fundo: a própria foto ampliada e desfocada preenche a caixa
            (mesma URL da foto principal → o navegador baixa uma vez só). */}
        <Image
          key={`bg-${selected.id}`}
          src={selectedUrl}
          alt=""
          aria-hidden
          fill
          quality={92}
          className="-z-10 scale-125 object-cover object-center opacity-90 blur-2xl saturate-150"
          sizes="(max-width: 1024px) 100vw, 58vw"
          priority
        />
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/10 via-black/20 to-black/40"
          aria-hidden
        />

        {/* Foto principal inteira, nítida, sem corte. */}
        <Image
          key={`fg-${selected.id}`}
          src={selectedUrl}
          alt={selected.alt_text || productName}
          fill
          quality={92}
          className="object-contain object-center drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
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
              className={`relative aspect-square w-20 flex-shrink-0 snap-start overflow-hidden border-b-2 bg-[#f4f6f8] transition-colors sm:w-28 ${
                img.id === selected.id
                  ? "border-blue-700"
                  : "border-transparent hover:border-gray-400"
              }`}
            >
              <Image
                src={getPublicImageUrl(img.storage_path)}
                alt={img.alt_text || productName}
                fill
                quality={85}
                className="object-cover object-center"
                sizes="112px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
