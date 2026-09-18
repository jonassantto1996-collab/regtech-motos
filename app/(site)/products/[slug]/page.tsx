import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/catalog/ProductGallery";
import InterestModal from "@/components/catalog/InterestModal";
import { getProductBySlug } from "@/lib/catalog/queries";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import { formatPriceBRL } from "@/lib/catalog/format";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Produto não encontrado — Regtech Motors" };
  }

  const title = `${product.brand} ${product.model} — Regtech Motors`;
  const description =
    (product.description ? product.description.slice(0, 160) : "") ||
    `${product.brand} ${product.model} por ${formatPriceBRL(product.price)}.`;

  const mainImage =
    product.product_images.find((img) => img.is_main) ??
    product.product_images[0];
  const imageUrl = mainImage
    ? getPublicImageUrl(mainImage.storage_path)
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
      ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const mainImage =
    product.product_images.find((img) => img.is_main) ??
    product.product_images[0];
  const imageUrl = mainImage
    ? getPublicImageUrl(mainImage.storage_path)
    : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.brand} ${product.model}`,
    description: product.description || undefined,
    ...(imageUrl ? { image: [imageUrl] } : {}),
    brand: { "@type": "Brand", name: product.brand },
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: product.price,
      ...(siteUrl ? { url: `${siteUrl}/products/${product.slug}` } : {}),
    },
  };

  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8 lg:px-8 lg:pb-28">
        <Link
          href="/products"
          className="inline-flex min-h-10 items-center text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 transition-colors hover:text-blue-700"
        >
          ← Voltar ao catálogo
        </Link>

        <div className="mt-5 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 xl:gap-20">
          <ProductGallery
            images={product.product_images}
            productName={`${product.brand} ${product.model}`}
          />

          <div className="lg:pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
              {product.brand}
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
              {product.model}
            </h1>
            <p className="mt-5 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              {formatPriceBRL(product.price)}
            </p>

            <div className="mt-8 border-y border-gray-200 py-7">
              <InterestModal productId={product.id} />
              <p className="mt-3 text-sm leading-6 text-gray-500">
                Registre seu interesse para continuar o atendimento pelo WhatsApp.
              </p>
            </div>

            <dl className="divide-y divide-gray-200 border-b border-gray-200 text-sm">
              <div className="grid grid-cols-2 gap-6 py-4">
                <dt className="text-gray-500">Disponibilidade</dt>
                <dd className="text-right font-medium text-gray-950">{product.availability}</dd>
              </div>
              <div className="grid grid-cols-2 gap-6 py-4">
                <dt className="text-gray-500">Garantia</dt>
                <dd className="text-right font-medium text-gray-950">{product.warranty}</dd>
              </div>
              <div className="grid grid-cols-2 gap-6 py-4">
                <dt className="text-gray-500">Retirada disponível</dt>
                <dd className="text-right font-medium text-gray-950">
                  {product.pickup_available ? "Sim" : "Não"}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-6 py-4">
                <dt className="text-gray-500">Categoria</dt>
                <dd className="text-right font-medium text-gray-950">{product.category}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-12 grid gap-10 border-t border-gray-200 pt-10 sm:mt-16 sm:pt-12 lg:mt-16 lg:grid-cols-2 lg:gap-16 lg:pt-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
              Detalhes
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              Informações do modelo
            </h2>

            {product.description ? (
              <p className="mt-6 max-w-xl whitespace-pre-line text-base leading-7 text-gray-600">
                {product.description}
              </p>
            ) : (
              <p className="mt-6 text-sm text-gray-500">
                Consulte a equipe Regtech para mais informações sobre este modelo.
              </p>
            )}

            {product.product_colors.length > 0 && (
              <div className="mt-9">
                <h3 className="text-sm font-semibold text-gray-950">Cores disponíveis</h3>
                <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                  {product.product_colors.map((c) => (
                    <li key={c.id} className="border-b border-gray-300 pb-1 text-sm text-gray-700">
                      {c.color}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {product.product_specs.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                Ficha técnica
              </p>
              <dl className="mt-5 divide-y divide-gray-200 border-y border-gray-200">
                {product.product_specs.map((s) => (
                  <div key={s.id} className="grid grid-cols-2 gap-6 py-4 text-sm">
                    <dt className="text-gray-500">{s.spec_key}</dt>
                    <dd className="text-right font-medium text-gray-950">{s.spec_value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
