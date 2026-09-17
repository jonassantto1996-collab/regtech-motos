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
  // A consulta já traz só a imagem principal embutida (quando existe).
  const mainImage = product.product_images[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex min-w-0 flex-col border-t border-gray-200 pt-4 outline-none transition-colors focus-visible:border-blue-700 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-4 sm:pt-5"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100/70">
        {mainImage ? (
          <Image
            src={getPublicImageUrl(mainImage.storage_path)}
            alt={mainImage.alt_text || `${product.brand} ${product.model}`}
            fill
            className="object-contain p-3 transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.025] sm:p-5"
            sizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) 50vw, 36rem"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Sem imagem
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col pt-5">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-blue-700">
          {product.brand}
        </span>
        <h3 className="mt-1 text-xl font-semibold tracking-tight text-gray-950 sm:text-2xl">
          {product.model}
        </h3>
        <p className="mt-3 text-base font-medium text-gray-700 sm:text-lg">
          {formatPriceBRL(product.price)}
        </p>
        <span className="mt-5 inline-flex min-h-11 items-center justify-between border-b border-gray-300 pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-900 transition-colors group-hover:border-blue-700 group-hover:text-blue-700">
          Ver modelo
          <span aria-hidden className="text-lg font-normal transition-transform motion-safe:group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
