import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsAppIcon, MapPinIcon } from "@/components/icons/SiteIcons";
import CellshopProductCard from "@/components/cellshop/CellshopProductCard";
import { CELLSHOP, CELLSHOP_URL, getCellshopBase } from "@/lib/cellshop/config";
import { categoryFromPath, categoryPage } from "@/lib/cellshop/seo";
import { getCellshopCategories, getCellshopProducts, getPriceMode, withWholesalePrices } from "@/lib/cellshop/queries";

/**
 * Página de uma categoria (ex.: regtechcellshop.com.br/boombox-jbl), feita para
 * quem procura no Google "<produto> em Tucumã": título com a cidade, texto da
 * loja e os produtos da categoria. Endereço que não é de categoria dá 404.
 */
export const dynamic = "force-dynamic";

type Params = Promise<{ secao: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { secao } = await params;
  const category = categoryFromPath(secao, await getCellshopCategories());
  if (!category) return { title: "Página não encontrada" };
  const page = categoryPage(category);
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/${page.path}` },
    openGraph: { title: `${page.title} | Regtech Cell Shop`, description: page.description, url: `/${page.path}` },
  };
}

export default async function CellshopCategoryPage({ params }: { params: Params }) {
  const { secao } = await params;
  const [categories, base, mode, publicProducts] = await Promise.all([getCellshopCategories(), getCellshopBase(), getPriceMode(), getCellshopProducts()]);
  const category = categoryFromPath(secao, categories);
  if (!category) notFound();

  const page = categoryPage(category);
  const inCategory = publicProducts.filter((p) => p.category_id === category.id);
  // Lojista aprovado vê o atacado; o cliente final, o varejo.
  const products = mode === "wholesale" ? await withWholesalePrices(inCategory) : inCategory;
  const others = categories.filter((c) => c.id !== category.id && publicProducts.some((p) => p.category_id === c.id));
  const home = base || "/";
  const pageUrl = `${CELLSHOP_URL}/${page.path}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Regtech Cell Shop", item: `${CELLSHOP_URL}/` },
          { "@type": "ListItem", position: 2, name: category.name, item: pageUrl },
        ],
      },
      {
        "@type": "ItemList",
        name: page.h1,
        url: pageUrl,
        itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${CELLSHOP_URL}/produto/${p.slug}` })),
      },
    ],
  };

  return (
    <main className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="bg-[#070a12] text-white">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-10 lg:px-8">
          <nav aria-label="Você está em" className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            <Link href={home} className="inline-flex min-h-10 items-center hover:text-[#22d3ee]">Loja</Link>
            <span aria-hidden>/</span>
            <span className="text-slate-200">{category.name}</span>
          </nav>
          <h1 className="mt-3 max-w-3xl text-[2rem] font-bold leading-[1.08] tracking-tight sm:text-5xl">{page.h1}</h1>
          <p className="mt-4 max-w-2xl text-[0.9375rem] leading-6 text-slate-300 sm:text-lg sm:leading-7">
            Na Regtech Cell Shop, no Centro de Tucumã, você encontra {page.lead}. Escolha o modelo, simule as parcelas e fale com a loja
            pelo WhatsApp com a mensagem pronta. Retirada na loja e envio para o sul do Pará.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={mode === "wholesale" ? CELLSHOP.wholesaleWhatsapp : CELLSHOP.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-[#15803d] px-6 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#166534]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Falar com a loja
            </a>
            <a
              href={CELLSHOP.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-6 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-[#22d3ee] hover:text-[#22d3ee]"
            >
              <MapPinIcon className="h-4 w-4" />
              Como chegar
            </a>
          </div>
        </div>
      </section>

      <section aria-labelledby="produtos-titulo" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <h2 id="produtos-titulo" className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
          {products.length} {products.length === 1 ? "produto" : "produtos"} em {category.name}
        </h2>
        {products.length ? (
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {products.map((product) => (
              <li key={product.id}>
                <CellshopProductCard product={product} mode={mode} base={base} categoryName={category.name} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 rounded-2xl bg-[#f3f5f8] p-6 text-sm text-slate-600">
            Nenhum produto nesta categoria agora. Fale com a loja pelo WhatsApp para saber da próxima chegada.
          </p>
        )}

        {others.length > 0 && (
          <nav aria-label="Outras categorias" className="mt-12 border-t border-slate-200 pt-8">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Veja também</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {others.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`${base}/${categoryPage(c).path}`}
                    className="inline-flex min-h-10 items-center rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-800 transition-colors hover:border-[#0a6cff] hover:text-[#0a5cff]"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </section>
    </main>
  );
}
