import Image from "next/image";
import Link from "next/link";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import { formatPriceBRL } from "@/lib/catalog/format";
import type { CatalogProductListItem } from "@/lib/catalog/queries";

export default function ProductCard({
  product,
}: {
  product: CatalogProductListItem;
}) {
  const mainImage = product.product_images[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex min-w-0 flex-col border-t border-gray-200 pt-4 outline-none transition-colors duration-300 hover:border-blue-300 focus-visible:border-blue-700 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-4 sm:pt-5"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100/70 transition-colors duration-500 group-hover:from-blue-50/70 group-hover:to-gray-100/70">
        <div className="absolute left-3 top-3 z-10 inline-flex min-h-7 items-center rounded-full border border-emerald-200 bg-white/95 px-3 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-emerald-700 shadow-sm backdrop-blur sm:left-4 sm:top-4">
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
          <span className="capitalize">{product.availability}</span>
        </div>

        {mainImage ? (
          <Image
            src={getPublicImageUrl(mainImage.storage_path)}
            alt={mainImage.alt_text || `${product.brand} ${product.model}`}
            fill
            className="object-contain p-3 transition-transform duration-500 ease-out motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:scale-[1.025] sm:p-5"
            sizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) 50vw, 36rem"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Sem imagem
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col pt-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-blue-700">
            {product.brand}
          </span>
          <span className="text-[0.625rem] uppercase tracking-[0.16em] text-gray-400">
            {product.category}
          </span>
        </div>

        <h3 className="mt-1 text-xl font-semibold tracking-tight text-gray-950 transition-colors duration-300 group-hover:text-blue-800 sm:text-2xl">
          {product.model}
        </h3>

        <p className="mt-3 text-base font-semibold text-gray-800 sm:text-lg">
          {formatPriceBRL(product.price)}
        </p>

        <span className="mt-5 inline-flex min-h-11 items-center justify-between border-b border-gray-300 pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-900 transition-colors group-hover:border-blue-700 group-hover:text-blue-700">
          Ver detalhes
          <span aria-hidden className="text-lg font-normal transition-transform duration-300 motion-safe:group-hover:translate-x-1.5">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
