"use client";

import { useState } from "react";
import Image from "next/image";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { CellshopImage } from "@/lib/cellshop/queries";
import { initialPhotoIndex, photoIndexForColor } from "@/lib/cellshop/variant-photo";
import { ProductPlaceholder } from "./CellshopProductCard";
import { useVariantColor } from "./VariantColor";

export default function CellshopGallery({ images, productName }: { images: CellshopImage[]; productName: string }) {
  // Cor da versão escolhida no bloco de compra (quando a foto tem cor cadastrada).
  const color = useVariantColor()?.color ?? null;
  const [index, setIndex] = useState(() => initialPhotoIndex(images, color));
  const [shownColor, setShownColor] = useState(color);
  if (color !== shownColor) {
    // Trocou a versão: vai para a foto daquela cor (se existir).
    setShownColor(color);
    const photo = photoIndexForColor(images, color);
    if (photo >= 0) setIndex(photo);
  }
  const selected = images[index] ?? images[0];

  return (
    <div>
      <div className="relative isolate aspect-square w-full overflow-hidden rounded-3xl border border-slate-200 bg-[#f3f5f8]">
        {selected ? (
          <Image
            key={selected.id}
            src={getPublicImageUrl(selected.storage_path)}
            alt={selected.alt_text || productName}
            fill
            priority
            quality={90}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-6 mix-blend-multiply sm:p-10"
          />
        ) : (
          <ProductPlaceholder />
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex snap-x gap-2.5 overflow-x-auto pb-1 sm:mt-4 sm:gap-3">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1} de ${productName}`}
              aria-pressed={i === index}
              className={`relative isolate aspect-square w-20 flex-shrink-0 snap-start overflow-hidden rounded-xl border-2 bg-[#f3f5f8] transition-colors sm:w-24 ${
                i === index ? "border-[#0a6cff]" : "border-transparent hover:border-slate-300"
              }`}
            >
              <Image
                src={getPublicImageUrl(img.storage_path)}
                alt=""
                fill
                sizes="96px"
                className="object-contain p-2 mix-blend-multiply"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
