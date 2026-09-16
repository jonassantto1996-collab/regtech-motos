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
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 transition hover:shadow-md"
    >
      <div className="relative aspect-square w-full bg-gray-100">
        {mainImage ? (
          <Image
            src={getPublicImageUrl(mainImage.storage_path)}
            alt={mainImage.alt_text || `${product.brand} ${product.model}`}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Sem imagem
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs uppercase tracking-wide text-gray-500">
          {product.brand}
        </span>
        <h3 className="font-medium text-gray-900">{product.model}</h3>
        <p className="mt-auto text-lg font-semibold text-gray-900">
          {formatPriceBRL(product.price)}
        </p>
      </div>
    </Link>
  );
}
