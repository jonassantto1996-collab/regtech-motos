import Image from "next/image";
import Link from "next/link";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import { formatCardInstallments, formatPriceBRL } from "@/lib/catalog/format";
import type { CatalogProductListItem } from "@/lib/catalog/queries";

export default function HomeProductCard({ product }: { product: CatalogProductListItem }) {
  const mainImage = product.product_images[0];
  const imageUrl = mainImage ? getPublicImageUrl(mainImage.storage_path) : null;
  const cardText = formatCardInstallments(product.card_price, product.card_installments);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group min-w-[84vw] snap-center border-r border-gray-200 pr-4 outline-none last:border-r-0 focus-visible:ring-2 focus-visible:ring-blue-700 sm:min-w-[18rem] sm:snap-start sm:pr-7 lg:min-w-0 lg:border-r-0 lg:pr-0"
    >
      <div className="relative aspect-square overflow-hidden bg-[#f4f6f8]">
        <span className="absolute left-3 top-3 z-20 inline-flex min-h-6 items-center rounded-full border border-emerald-200 bg-white/95 px-2.5 text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-emerald-700 shadow-sm">
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
          <span className="capitalize">{product.availability}</span>
        </span>

        {mainImage && imageUrl ? (
          <Image
            src={imageUrl}
            alt={mainImage.alt_text || `${product.brand} ${product.model}`}
            fill
            quality={88}
            className="object-cover object-center transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.025]"
            sizes="(max-width: 639px) 84vw, (max-width: 1023px) 18rem, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">Sem imagem</div>
        )}
      </div>

      <div className="pt-4 pb-1 lg:pt-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-blue-700">{product.brand}</p>
          <span className="text-[0.5625rem] uppercase tracking-[0.14em] text-gray-400">{product.category}</span>
        </div>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-tight text-gray-950 transition-colors group-hover:text-blue-700 lg:text-2xl">{product.model}</h3>
          <span aria-hidden className="text-lg text-gray-400 transition-all group-hover:translate-x-1 group-hover:text-blue-700">→</span>
        </div>
        <p className="mt-2 text-sm font-semibold text-gray-700 lg:text-base">
          {formatPriceBRL(product.price)}
          <span className="ml-1.5 text-xs font-medium text-gray-500">à vista</span>
        </p>
        {cardText && <p className="mt-0.5 text-xs text-gray-600 lg:text-sm">ou {cardText}</p>}
      </div>
    </Link>
  );
}
