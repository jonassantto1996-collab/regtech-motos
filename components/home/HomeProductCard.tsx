import Image from "next/image";
import Link from "next/link";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import { formatPriceBRL } from "@/lib/catalog/format";
import type { CatalogProductListItem } from "@/lib/catalog/queries";

export default function HomeProductCard({ product }: { product: CatalogProductListItem }) {
  const mainImage = product.product_images[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group min-w-[72vw] snap-start border-r border-gray-200 pr-5 outline-none last:border-r-0 focus-visible:ring-2 focus-visible:ring-blue-700 sm:min-w-[18rem] sm:pr-7 lg:min-w-0 lg:pr-7"
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-gray-50">
        <span className="absolute left-3 top-3 z-10 inline-flex min-h-6 items-center rounded-full border border-emerald-200 bg-white/95 px-2.5 text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-emerald-700 shadow-sm">
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
          <span className="capitalize">{product.availability}</span>
        </span>

        {mainImage ? (
          <Image
            src={getPublicImageUrl(mainImage.storage_path)}
            alt={mainImage.alt_text || `${product.brand} ${product.model}`}
            fill
            className="object-contain p-5 transition-transform duration-500 ease-out motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:scale-[1.03] lg:p-6"
            sizes="(max-width: 639px) 72vw, (max-width: 1023px) 18rem, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">Sem imagem</div>
        )}
      </div>

      <div className="pt-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-blue-700">{product.brand}</p>
          <span className="text-[0.5625rem] uppercase tracking-[0.14em] text-gray-400">{product.category}</span>
        </div>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-tight text-gray-950 transition-colors group-hover:text-blue-700">{product.model}</h3>
          <span aria-hidden className="text-lg text-gray-400 transition-all group-hover:translate-x-1 group-hover:text-blue-700">→</span>
        </div>
        <p className="mt-2 text-sm font-semibold text-gray-700">{formatPriceBRL(product.price)}</p>
      </div>
    </Link>
  );
}
