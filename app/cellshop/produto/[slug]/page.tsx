import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CellshopGallery from "@/components/cellshop/CellshopGallery";
import CellshopProductCard from "@/components/cellshop/CellshopProductCard";
import ProductBuyBox from "@/components/cellshop/ProductBuyBox";
import { CELLSHOP, CELLSHOP_URL, getCellshopBase } from "@/lib/cellshop/config";
import { productPrice, variantPrice } from "@/lib/cellshop/pricing";
import {
  getCellshopCategories,
  getCellshopProduct,
  getCellshopProducts,
  getPriceMode,
} from "@/lib/cellshop/queries";
import { getPublicImageUrl } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCellshopProduct(slug);
  if (!product) return { title: "Produto não encontrado" };
  const title = `${product.brand} ${product.name}`;
  const image = product.store_product_images[0];
  return {
    title,
    description:
      product.description.slice(0, 155) ||
      `${title} na Regtech Cell Shop, em Tucumã, PA. Simule as parcelas e compre pelo WhatsApp.`,
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: {
      title,
      url: `/produto/${product.slug}`,
      images: image ? [{ url: getPublicImageUrl(image.storage_path) }] : undefined,
    },
  };
}

export default async function CellshopProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [product, base, mode, categories, all] = await Promise.all([
    getCellshopProduct(slug),
    getCellshopBase(),
    getPriceMode(),
    getCellshopCategories(),
    getCellshopProducts(),
  ]);
  if (!product) notFound();

  const home = base || "/";
  const title = `${product.brand} ${product.name}`;
  const category = categories.find((c) => c.id === product.category_id);
  const variants = product.store_product_variants;
  const inStock = variants.length === 0 || variants.some((v) => v.stock_quantity > 0);
  const pageUrl = `${CELLSHOP_URL}/produto/${product.slug}`;

  // "Combina com": acessórios e carregadores primeiro, depois a mesma categoria.
  const accessoryIds = new Set(categories.filter((c) => ["acessorios", "carregadores"].includes(c.slug)).map((c) => c.id));
  const related = all
    .filter((p) => p.id !== product.id)
    .sort((a, b) => {
      const score = (p: typeof a) => (accessoryIds.has(p.category_id) && !accessoryIds.has(product.category_id) ? 2 : p.category_id === product.category_id ? 1 : 0);
      return score(b) - score(a);
    })
    .slice(0, 4);

  // Dados para o Google (resultado com preço). O Google exige preço na oferta:
  // produto sem preço ("Consulte o valor" / "Aguardando preço") não leva esse bloco,
  // senão o Search Console acusa erro crítico ("Especifique offers").
  const prices = (variants.length ? variants.map((v) => variantPrice(product, v, mode)) : [productPrice(product, mode)]).filter(
    (p): p is number => typeof p === "number" && Number.isFinite(p) && p > 0,
  );
  const lowestPrice = prices.length ? Math.min(...prices) : null;
  const jsonLd =
    lowestPrice === null
      ? null
      : {
          "@context": "https://schema.org",
          "@type": "Product",
          name: title,
          brand: { "@type": "Brand", name: product.brand },
          description: product.description || undefined,
          image: product.store_product_images.map((img) => getPublicImageUrl(img.storage_path)),
          url: pageUrl,
          offers: {
            "@type": "Offer",
            priceCurrency: "BRL",
            price: lowestPrice.toFixed(2),
            availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: pageUrl,
            seller: { "@type": "Organization", name: CELLSHOP.name },
          },
        };

  return (
    <main className="bg-white">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-5 sm:px-6 sm:pb-24 sm:pt-8 lg:px-8">
        <nav aria-label="Você está em" className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          <Link href={home} className="inline-flex min-h-10 items-center hover:text-[#0a6cff]">Loja</Link>
          {category && (
            <>
              <span aria-hidden>/</span>
              <Link href={`${home}?categoria=${category.slug}#vitrine`} className="inline-flex min-h-10 items-center hover:text-[#0a6cff]">
                {category.name}
              </Link>
            </>
          )}
        </nav>

        <div className="mt-3 grid gap-8 sm:mt-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <CellshopGallery images={product.store_product_images} productName={title} />
          </div>

          <div className="lg:pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border px-3 text-[0.625rem] font-bold uppercase tracking-[0.12em] ${
                  inStock ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-emerald-500" : "bg-slate-400"}`} />
                {inStock ? product.availability || "Disponível" : "Esgotado"}
              </span>
              {category && (
                <span className="inline-flex min-h-7 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-slate-600">
                  {category.name}
                </span>
              )}
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-[#0a6cff]">{product.brand}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">{product.name}</h1>
            {variants.length === 1 && <p className="mt-2 text-base text-slate-600">{variants[0].name}</p>}

            <ProductBuyBox
              product={product}
              productTitle={title}
              variants={variants}
              mode={mode}
              whatsapp={CELLSHOP.whatsapp}
              pageUrl={pageUrl}
            />

            <dl className="mt-8 divide-y divide-slate-200 border-y border-slate-200 text-sm">
              {product.warranty && (
                <div className="flex justify-between gap-6 py-4">
                  <dt className="text-slate-500">Garantia</dt>
                  <dd className="text-right font-semibold">{product.warranty}</dd>
                </div>
              )}
              <div className="flex justify-between gap-6 py-4">
                <dt className="text-slate-500">Retirada</dt>
                <dd className="text-right font-semibold">Na loja, em {CELLSHOP.addressLocality}</dd>
              </div>
              <div className="flex justify-between gap-6 py-4">
                <dt className="text-slate-500">Atendimento</dt>
                <dd className="text-right font-semibold">WhatsApp {CELLSHOP.telephone}</dd>
              </div>
            </dl>
          </div>
        </div>

        {(product.description || product.store_product_specs.length > 0) && (
          <div className="mt-14 grid gap-12 border-t border-slate-200 pt-10 sm:mt-20 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0a6cff]">Detalhes</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Sobre o produto</h2>
              <p className="mt-5 max-w-xl whitespace-pre-line text-base leading-7 text-slate-600">
                {product.description || "Fale com a loja para mais informações sobre este produto."}
              </p>
            </div>
            {product.store_product_specs.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0a6cff]">Ficha técnica</p>
                <dl className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
                  {product.store_product_specs.map((spec) => (
                    <div key={spec.id} className="grid grid-cols-2 gap-6 py-4 text-sm">
                      <dt className="text-slate-500">{spec.spec_key}</dt>
                      <dd className="text-right font-semibold">{spec.spec_value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        )}

        {related.length > 0 && (
          <section className="mt-16 border-t border-slate-200 pt-10 sm:mt-20">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0a6cff]">Combina com</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Você também pode gostar</h2>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {related.map((p) => (
                <CellshopProductCard key={p.id} product={p} mode={mode} base={base} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
