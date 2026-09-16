import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/catalog/ProductGallery";
import InterestModal from "@/components/catalog/InterestModal";
import { getProductBySlug } from "@/lib/catalog/queries";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import { formatPriceBRL } from "@/lib/catalog/format";

// Renderização totalmente dinâmica (sem cache/revalidation) — mesma
// decisão aplicada à listagem.
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
    // Não revela se o slug não existe ou se o produto está inativo.
    return { title: "Produto não encontrado — Regtech Motos" };
  }

  const title = `${product.brand} ${product.model} — Regtech Motos`;
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

  if (!product) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const mainImage =
    product.product_images.find((img) => img.is_main) ??
    product.product_images[0];
  const imageUrl = mainImage
    ? getPublicImageUrl(mainImage.storage_path)
    : undefined;

  // Dados estruturados conservadores: só campos que temos com segurança.
  // "availability" fica de fora de propósito (Decisão 8) — o campo atual
  // no banco é texto livre e mapear errado pra um enum do schema.org seria
  // pior do que não incluir.
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
      ...(siteUrl
        ? { url: `${siteUrl}/products/${product.slug}` }
        : {}),
    },
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery
          images={product.product_images}
          productName={`${product.brand} ${product.model}`}
        />

        <div>
          <span className="text-sm uppercase tracking-wide text-gray-500">
            {product.brand}
          </span>
          <h1 className="text-3xl font-bold text-gray-900">
            {product.model}
          </h1>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {formatPriceBRL(product.price)}
          </p>

          <InterestModal productId={product.id} />

          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-gray-500">Disponibilidade</dt>
              <dd className="text-gray-900">{product.availability}</dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-gray-500">Garantia</dt>
              <dd className="text-gray-900">{product.warranty}</dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-gray-500">Retirada disponível</dt>
              <dd className="text-gray-900">
                {product.pickup_available ? "Sim" : "Não"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-gray-500">Categoria</dt>
              <dd className="text-gray-900">{product.category}</dd>
            </div>
          </dl>

          {product.product_colors.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 font-semibold text-gray-900">
                Cores disponíveis
              </h2>
              <ul className="flex flex-wrap gap-2">
                {product.product_colors.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700"
                  >
                    {c.color}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.product_specs.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 font-semibold text-gray-900">
                Especificações técnicas
              </h2>
              <dl className="space-y-1 text-sm">
                {product.product_specs.map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between border-b border-gray-100 pb-1"
                  >
                    <dt className="text-gray-500">{s.spec_key}</dt>
                    <dd className="text-gray-900">{s.spec_value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {product.description && (
            <div className="mt-6">
              <h2 className="mb-2 font-semibold text-gray-900">Descrição</h2>
              <p className="whitespace-pre-line text-gray-700">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
