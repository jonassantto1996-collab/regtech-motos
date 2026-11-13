"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { CellshopImage } from "@/lib/cellshop/queries";
import { slideFromScroll, stepSlide } from "@/lib/cellshop/gallery";
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

  const count = images.length;
  const current = Math.min(index, Math.max(0, count - 1));
  const trackRef = useRef<HTMLDivElement>(null);
  // Enquanto a caixa anda sozinha (miniatura, seta ou cor), a rolagem não muda a foto escolhida.
  // Vale no máximo 900 ms: depois disso (ou se a pessoa mexer), manda o que está na caixa.
  const target = useRef<{ i: number; until: number } | null>(null);
  const placed = useRef(false);

  // Foto escolhida por fora (miniatura, seta, cor): leva a caixa grande até ela.
  useEffect(() => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    if (slideFromScroll(el.scrollLeft, el.clientWidth, count) === current) {
      placed.current = true;
      return;
    }
    target.current = { i: current, until: Date.now() + 900 };
    el.scrollTo({ left: current * el.clientWidth, behavior: placed.current ? "smooth" : "auto" });
    placed.current = true;
  }, [current, count]);

  // Deslizou com o dedo (ou trackpad): a foto que parou na caixa vira a escolhida.
  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    const at = slideFromScroll(el.scrollLeft, el.clientWidth, count);
    const t = target.current;
    if (t) {
      const reached = Math.abs(el.scrollLeft - t.i * el.clientWidth) < 2;
      if (!reached && Date.now() < t.until) return;
      target.current = null;
    }
    if (at !== current) setIndex(at);
  }, [count, current]);

  // Parou de rolar: a foto que ficou na caixa é a escolhida (garante o final do deslize).
  const onScrollEnd = useCallback(() => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    target.current = null;
    const at = slideFromScroll(el.scrollLeft, el.clientWidth, count);
    if (at !== current) setIndex(at);
  }, [count, current]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scrollend", onScrollEnd);
    return () => el.removeEventListener("scrollend", onScrollEnd);
  }, [onScrollEnd]);

  // A pessoa mexeu (dedo, trackpad, mouse): vale o que ela está fazendo, não a animação.
  const releaseTarget = useCallback(() => {
    target.current = null;
  }, []);

  const go = (delta: number) => setIndex(stepSlide(current, delta, count));

  return (
    <div>
      <div
        className="group relative isolate aspect-square w-full overflow-hidden rounded-3xl border border-slate-200 bg-[#f3f5f8]"
        role={count > 1 ? "region" : undefined}
        aria-roledescription={count > 1 ? "carrossel" : undefined}
        aria-label={count > 1 ? `Fotos de ${productName}` : undefined}
      >
        {count === 0 ? (
          <ProductPlaceholder />
        ) : (
          <div
            ref={trackRef}
            onScroll={onScroll}
            onTouchStart={releaseTarget}
            onWheel={releaseTarget}
            onPointerDown={releaseTarget}
            className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((img, i) => (
              <div
                key={img.id}
                className="relative h-full w-full shrink-0 snap-center snap-always"
                role={count > 1 ? "group" : undefined}
                aria-roledescription={count > 1 ? "foto" : undefined}
                aria-label={count > 1 ? `${i + 1} de ${count}` : undefined}
                aria-hidden={i !== current}
              >
                <Image
                  src={getPublicImageUrl(img.storage_path)}
                  alt={img.alt_text || productName}
                  fill
                  priority={i === current}
                  quality={90}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-6 mix-blend-multiply sm:p-10"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={current === 0}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-md transition-opacity hover:bg-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6cff] disabled:pointer-events-none disabled:!opacity-0 group-hover:opacity-100 sm:flex sm:opacity-0"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={current === count - 1}
              aria-label="Próxima foto"
              className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-md transition-opacity hover:bg-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6cff] disabled:pointer-events-none disabled:!opacity-0 group-hover:opacity-100 sm:flex sm:opacity-0"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-[#070a12]/70 px-2.5 py-1 text-xs font-semibold tabular-nums text-white"
            >
              {current + 1}/{count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 flex snap-x gap-2.5 overflow-x-auto pb-1 sm:mt-4 sm:gap-3">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1} de ${productName}`}
              aria-pressed={i === current}
              className={`relative isolate aspect-square w-20 flex-shrink-0 snap-start overflow-hidden rounded-xl border-2 bg-[#f3f5f8] transition-colors sm:w-24 ${
                i === current ? "border-[#0a6cff]" : "border-transparent hover:border-slate-300"
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
