import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/catalog/ProductGallery";
import InterestModal from "@/components/catalog/InterestModal";
import { getProductBySlug } from "@/lib/catalog/queries";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import { formatCardInstallments, formatPriceBRL } from "@/lib/catalog/format";
import { getSiteUrl } from "@/lib/site-url";
import { getCatalogSettings } from "@/lib/catalog/settings";

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

  const { showPrices } = await getCatalogSettings();
  const title = `${product.brand} ${product.model} — Regtech Motors`;
  const description =
    (product.description ? product.description.slice(0, 160) : "") ||
    (showPrices
      ? `${product.brand} ${product.model} por ${formatPriceBRL(product.price)} à vista.`
      : `${product.brand} ${product.model} na Regtech Motors. Consulte o valor.`);

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

  const siteUrl = getSiteUrl();
  const { showPrices } = await getCatalogSettings();
  const cardText = formatCardInstallments(product.card_price, product.card_installments);
  const mainImage =
    product.product_images.find((img) => img.is_main) ??
    product.product_images[0];
  const imageUrl = mainImage
    ? getPublicImageUrl(mainImage.storage_path)
    : undefined;

  const normalizedAvailability = product.availability?.trim().toLowerCase() ?? "";
  const availabilitySchema = normalizedAvailability.includes("indispon")
    ? "https://schema.org/OutOfStock"
    : normalizedAvailability.includes("dispon")
      ? "https://schema.org/InStock"
      : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.brand} ${product.model}`,
    description: product.description || undefined,
    ...(imageUrl ? { image: [imageUrl] } : {}),
    brand: { "@type": "Brand", name: product.brand },
    category: product.category,
    seller: { "@id": `${siteUrl}/#motorcycle-dealer` },
    // Com os preços ocultos no site, o preço também sai dos dados para o Google.
    ...(showPrices
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "BRL",
            price: product.price,
            url: `${siteUrl}/products/${product.slug}`,
            ...(availabilitySchema ? { availability: availabilitySchema } : {}),
            seller: { "@id": `${siteUrl}/#motorcycle-dealer` },
          },
        }
      : {}),
  };

  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 pb-14 pt-4 sm:px-6 sm:pb-20 sm:pt-8 lg:px-8 lg:pb-28">
        <Link
          href="/products"
          className="inline-flex min-h-10 items-center text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 transition-colors hover:text-blue-700"
        >
          ← Voltar ao catálogo
        </Link>

        <div className="mt-3 grid gap-7 sm:mt-5 sm:gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 xl:gap-20">
          <div className="lg:sticky lg:top-6 lg:self-start">
            <ProductGallery
              images={product.product_images}
              productName={`${product.brand} ${product.model}`}
            />
          </div>

          <div className="lg:pt-5">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-7 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-emerald-700">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                <span className="capitalize">{product.availability}</span>
              </span>
              <span className="inline-flex min-h-7 items-center rounded-full border border-gray-200 bg-gray-50 px-3 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-gray-600">
                {product.category}
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
              {product.brand}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-5xl">
              {product.model}
            </h1>
            {showPrices ? (
            <div className="mt-4 sm:mt-5">
              <p className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                {formatPriceBRL(product.price)}
                <span className="ml-2 text-sm font-medium tracking-normal text-gray-500 sm:text-base">à vista</span>
              </p>
              {cardText && product.card_price && (
                <p className="mt-2 text-sm text-gray-600 sm:text-base">
                  ou <strong className="font-semibold text-gray-900">{cardText}</strong>{" "}
                  <span className="text-gray-500">(total {formatPriceBRL(product.card_price)})</span>
                </p>
              )}
            </div>
            ) : (
              <p className="mt-4 text-2xl font-semibold tracking-tight text-gray-900 sm:mt-5 sm:text-3xl">
                Consulte o valor
              </p>
            )}

            <div className="mt-6 border-y border-gray-200 py-6 sm:mt-8 sm:py-7">
              <InterestModal productId={product.id} />
              <div className="mt-4 grid gap-2 text-sm text-gray-500">
                <p>Registre seu interesse para continuar o atendimento pelo WhatsApp.</p>
                <p className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden />
                  Atendimento direto com a equipe Regtech.
                </p>
              </div>
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

        <div className="mt-10 grid gap-9 border-t border-gray-200 pt-8 sm:mt-16 sm:gap-10 sm:pt-12 lg:mt-16 lg:grid-cols-2 lg:gap-16 lg:pt-14">
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
                <ul className="mt-3 flex flex-wrap gap-2">
                  {product.product_colors.map((c) => (
                    <li key={c.id} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
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
