import Image from "next/image";
import Link from "next/link";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { CellshopProduct } from "@/lib/cellshop/queries";
import {
  cardCondition,
  formatBRL,
  priceLabel,
  productPrice,
  variantPrice,
  type PriceMode,
} from "@/lib/cellshop/pricing";

export function ProductPlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400 ${className}`}>
      <svg aria-hidden viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
        <path d="M10.5 18.5h3" strokeLinecap="round" />
      </svg>
      <span className="text-xs font-medium">Foto em breve</span>
    </div>
  );
}

export default function CellshopProductCard({
  product,
  mode,
  base,
  categoryName,
}: {
  product: CellshopProduct;
  mode: PriceMode;
  base: string;
  categoryName?: string;
}) {
  const image = product.store_product_images[0];
  const variants = product.store_product_variants;
  const inStock = variants.length === 0 || variants.some((v) => v.stock_quantity > 0);

  // Menor preço entre as versões (para "a partir de").
  const prices = (variants.length ? variants.map((v) => variantPrice(product, v, mode)) : [productPrice(product, mode)])
    .filter((p): p is number => p !== null);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const hasRange = new Set(prices).size > 1;
  const card = cardCondition(product, minPrice, mode);
  const versions = variants.length > 1 ? `${variants.length} versões` : variants[0]?.name.split("·").slice(0, 2).join("·").trim();

  return (
    <Link
      href={`${base}/produto/${product.slug}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white outline-none transition duration-300 hover:-translate-y-0.5 hover:border-[#0a6cff]/40 hover:shadow-[0_18px_40px_-24px_rgba(10,60,160,0.45)] focus-visible:ring-2 focus-visible:ring-[#0a6cff] focus-visible:ring-offset-2"
    >
      <div className="relative isolate aspect-square w-full bg-[#f3f5f8]">
        <span
          className={`absolute left-3 top-3 z-10 inline-flex min-h-7 items-center gap-1.5 rounded-full border bg-white/95 px-3 text-[0.625rem] font-bold uppercase tracking-[0.12em] ${
            inStock ? "border-emerald-200 text-emerald-700" : "border-slate-200 text-slate-500"
          }`}
        >
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-emerald-500" : "bg-slate-400"}`} />
          {inStock ? "Disponível" : "Esgotado"}
        </span>
        {image ? (
          <Image
            src={getPublicImageUrl(image.storage_path)}
            alt={image.alt_text || `${product.brand} ${product.name}`}
            fill
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 22rem"
            className="object-contain p-5 mix-blend-multiply transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.04] sm:p-7"
          />
        ) : (
          <ProductPlaceholder />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#0a6cff]">{product.brand}</span>
          {categoryName && <span className="text-[0.625rem] uppercase tracking-[0.14em] text-slate-500">{categoryName}</span>}
        </div>
        <h3 className="mt-1 text-base font-semibold leading-snug tracking-tight text-slate-950 sm:text-lg">{product.name}</h3>
        {versions && <p className="mt-1 line-clamp-1 text-xs text-slate-500 sm:text-sm">{versions}</p>}

        <div className="mt-auto pt-4">
          {minPrice !== null ? (
            <>
              {hasRange && <p className="text-xs text-slate-500">a partir de</p>}
              <p className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
                {formatBRL(minPrice)}
                <span className="ml-1.5 text-xs font-medium text-slate-500">{priceLabel(mode)}</span>
              </p>
              {card && (
                <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
                  ou <strong className="font-semibold text-slate-900">{card.installments}x de {formatBRL(card.parcel)}</strong> no cartão
                </p>
              )}
            </>
          ) : (
            <p className="text-base font-semibold text-slate-900">Consulte o valor</p>
          )}
          <span className="mt-4 inline-flex min-h-10 w-full items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-900 transition-colors group-hover:text-[#0a6cff]">
            Ver detalhes
            <span aria-hidden className="text-base font-normal transition-transform duration-300 motion-safe:group-hover:translate-x-1">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
