import type { Metadata } from "next";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/icons/SiteIcons";
import CellshopProductCard from "@/components/cellshop/CellshopProductCard";
import { CELLSHOP, getCellshopBase } from "@/lib/cellshop/config";
import CellshopHeroCarousel, { type HeroBanner } from "@/components/cellshop/CellshopHeroCarousel";
import { getCellshopBanners, getCellshopCategories, getCellshopProducts, getPriceMode, matchesSearch, type CellshopBanner } from "@/lib/cellshop/queries";
import { bannerHref, commonRatio } from "@/lib/store/banners";
import { getPublicImageUrl } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

type SearchParams = Promise<{ categoria?: string; q?: string }>;

/**
 * Banners do topo: a versão que falta usa a próxima maior (sem celular, usa a
 * do tablet; sem tablet, a do computador). A caixa do carrossel segue a
 * proporção dos banners em cada tela.
 */
function heroBanners(list: CellshopBanner[], home: string) {
  const banners: HeroBanner[] = list.map((b) => {
    const desktop = { src: getPublicImageUrl(b.desktop_path), width: b.desktop_width, height: b.desktop_height };
    const tablet = b.tablet_path ? { src: getPublicImageUrl(b.tablet_path), width: b.tablet_width, height: b.tablet_height } : desktop;
    const mobile = b.mobile_path ? { src: getPublicImageUrl(b.mobile_path), width: b.mobile_width, height: b.mobile_height } : tablet;
    return { id: b.id, title: b.title, href: bannerHref(b.link_url, home), desktop, tablet, mobile };
  });
  const ratios = {
    desktop: commonRatio(banners.map((b) => b.desktop)) ?? 16 / 6,
    tablet: commonRatio(banners.map((b) => b.tablet)) ?? 4 / 3,
    mobile: commonRatio(banners.map((b) => b.mobile)) ?? 4 / 5,
  };
  return { banners, ratios };
}

export default async function CellshopHome({ searchParams }: { searchParams: SearchParams }) {
  const [{ categoria, q }, base, categories, products, mode, rawBanners] = await Promise.all([
    searchParams,
    getCellshopBase(),
    getCellshopCategories(),
    getCellshopProducts(),
    getPriceMode(),
    getCellshopBanners(),
  ]);

  const home = base || "/";
  const { banners, ratios } = heroBanners(rawBanners, home);
  const query = (q ?? "").trim().slice(0, 80);
  const activeCategory = categories.find((c) => c.slug === categoria) ?? null;
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const countByCategory = new Map<string, number>();
  for (const p of products) countByCategory.set(p.category_id, (countByCategory.get(p.category_id) ?? 0) + 1);
  const visibleCategories = categories.filter((c) => (countByCategory.get(c.id) ?? 0) > 0);

  const list = products
    .filter((p) => !activeCategory || p.category_id === activeCategory.id)
    .filter((p) => !query || matchesSearch(p, query));

  const hrefFor = (slug?: string) => {
    const params = new URLSearchParams();
    if (slug) params.set("categoria", slug);
    if (query) params.set("q", query);
    const qs = params.toString();
    return `${home}${qs ? `?${qs}` : ""}#vitrine`;
  };

  const intro = (
    <div className="relative isolate flex h-full items-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 -z-10 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(10,108,255,0.35),transparent_65%)]"
      />
      <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 sm:pt-16 lg:px-8 ${rawBanners.length ? "pb-16 pt-8 sm:pb-20" : "pb-14 pt-12 sm:pb-20 lg:pb-24"}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#22d3ee]">Regtech Cell Shop · Tucumã, PA</p>
        <h1 className="mt-4 max-w-3xl text-[2.125rem] font-bold leading-[1.05] tracking-tight sm:text-6xl">
          Tecnologia de verdade, com atendimento de perto.
        </h1>
        <p className="mt-5 max-w-2xl text-[0.9375rem] leading-6 text-slate-300 sm:mt-6 sm:text-lg sm:leading-7">
          Smartphones, tablets, carregadores, Bombox, Starlink e acessórios. Escolha o produto, simule as parcelas e fale com a loja no WhatsApp com a mensagem pronta.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row">
          <a
            href="#vitrine"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#00c8ff] to-[#0a5cff] px-7 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:brightness-110"
          >
            Ver produtos
          </a>
          <a
            href={CELLSHOP.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-white/20 px-7 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-[#22d3ee] hover:text-[#22d3ee]"
          >
            <WhatsAppIcon className="h-5 w-5" /> Falar com a loja
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <main>
      {banners.length ? (
        <CellshopHeroCarousel intro={intro} banners={banners} ratios={ratios} />
      ) : (
        <section aria-label="Regtech Cell Shop" className="relative isolate overflow-hidden bg-[#070a12] text-white">
          {intro}
        </section>
      )}

      <section aria-label="Por que comprar na Regtech Cell Shop" className="border-t border-white/10 bg-[#070a12] text-white">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-6 px-4 py-8 sm:grid-cols-4 sm:px-6 lg:px-8">
          {[
            ["+14 anos", "de loja na região"],
            ["Cartão", "simule as parcelas no site"],
            ["WhatsApp", "com o produto na mensagem"],
            ["Retirada", "na loja em Tucumã"],
          ].map(([title, text]) => (
            <div key={title}>
              <dt className="text-lg font-bold text-white sm:text-xl">{title}</dt>
              <dd className="mt-1 text-sm text-slate-400">{text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="vitrine" className="scroll-mt-20 bg-[#f6f8fb]">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0a6cff]">Vitrine</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                {activeCategory ? activeCategory.name : "Todos os produtos"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {list.length} {list.length === 1 ? "produto" : "produtos"}
                {query ? ` para “${query}”` : ""}
              </p>
            </div>
            <form action={home} method="get" role="search" className="flex w-full gap-2 lg:w-[26rem]">
              {activeCategory && <input type="hidden" name="categoria" value={activeCategory.slug} />}
              <label htmlFor="cs-search" className="sr-only">Buscar produto</label>
              <input
                id="cs-search"
                name="q"
                defaultValue={query}
                placeholder="Buscar: Galaxy, Poco, carregador…"
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-[#0a6cff] focus:ring-2 focus:ring-[#0a6cff]/20"
              />
              <button type="submit" className="min-h-12 shrink-0 rounded-xl bg-[#070a12] px-5 text-sm font-semibold text-white hover:bg-[#151b2b]">
                Buscar
              </button>
            </form>
          </div>

          <nav aria-label="Categorias" className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
            {[{ slug: undefined as string | undefined, name: "Todos", count: products.length }, ...visibleCategories.map((c) => ({ slug: c.slug, name: c.name, count: countByCategory.get(c.id) ?? 0 }))].map((c) => {
              const active = (c.slug ?? null) === (activeCategory?.slug ?? null);
              return (
                <Link
                  key={c.name}
                  href={hrefFor(c.slug)}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
                    active ? "border-[#070a12] bg-[#070a12] text-white" : "border-slate-300 bg-white text-slate-800 hover:border-[#0a6cff]"
                  }`}
                >
                  {c.name}
                  <span className={`text-xs ${active ? "text-slate-300" : "text-slate-500"}`}>{c.count}</span>
                </Link>
              );
            })}
          </nav>

          {list.length ? (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((product) => (
                <CellshopProductCard
                  key={product.id}
                  product={product}
                  mode={mode}
                  base={base}
                  categoryName={activeCategory ? undefined : categoryName.get(product.category_id)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-lg font-semibold">Nenhum produto encontrado.</p>
              <p className="mt-2 text-sm text-slate-600">Tente outra busca ou fale com a loja: a gente procura para você.</p>
              <Link href={`${home}#vitrine`} className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-5 text-sm font-semibold hover:border-[#0a6cff]">
                Ver todos os produtos
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0a6cff]">Como comprar</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Do site para a sua mão em três passos.</h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              ["Escolha o produto", "Veja as fotos, as versões e a ficha técnica de cada produto."],
              ["Simule as parcelas", "Compare o valor e as parcelas no cartão antes de chamar a loja."],
              ["Chame no WhatsApp", "A mensagem já vai com o produto escolhido. É só enviar."],
            ].map(([title, text], i) => (
              <li key={title} className="border-t-2 border-[#070a12] pt-5">
                <span className="bg-gradient-to-r from-[#00c8ff] to-[#0a5cff] bg-clip-text text-sm font-bold text-transparent">0{i + 1}</span>
                <h3 className="mt-2 text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-base leading-7 text-slate-600">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
