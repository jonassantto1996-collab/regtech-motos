import type { Metadata } from "next";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/icons/SiteIcons";
import CellshopCatalog from "@/components/cellshop/CellshopCatalog";
import BrandMarquee from "@/components/cellshop/BrandMarquee";
import { CELLSHOP, getCellshopBase } from "@/lib/cellshop/config";
import CellshopHeroCarousel, { type HeroBanner } from "@/components/cellshop/CellshopHeroCarousel";
import { getCellshopBanners, getCellshopCategories, getCellshopProducts, getPriceMode, withWholesalePrices, type CellshopBanner } from "@/lib/cellshop/queries";
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
  const [{ categoria, q }, base, categories, publicProducts, mode, rawBanners] = await Promise.all([
    searchParams,
    getCellshopBase(),
    getCellshopCategories(),
    getCellshopProducts(),
    getPriceMode(),
    getCellshopBanners(),
  ]);
  // Lojista aprovado vê o atacado; o cliente final, o varejo.
  const products = mode === "wholesale" ? await withWholesalePrices(publicProducts) : publicProducts;

  const home = base || "/";
  const { banners, ratios } = heroBanners(rawBanners, home);
  const query = (q ?? "").trim().slice(0, 80);
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
            href={mode === "wholesale" ? CELLSHOP.wholesaleWhatsapp : CELLSHOP.whatsapp}
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
            ["Suporte técnico", "assistência na própria loja"],
            ["WhatsApp", "com o produto na mensagem"],
            ["Retirada e envio", "para todo o sul do Pará"],
          ].map(([title, text]) => (
            <div key={title}>
              <dt className="text-lg font-bold text-white sm:text-xl">{title}</dt>
              <dd className="mt-1 text-sm text-slate-400">{text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <BrandMarquee />

      <CellshopCatalog
        products={products}
        categories={categories}
        mode={mode}
        base={base}
        whatsapp={mode === "wholesale" ? CELLSHOP.wholesaleWhatsapp : CELLSHOP.whatsapp}
        initialQuery={query}
        initialCategory={categories.some((c) => c.slug === categoria) ? (categoria as string) : null}
      />

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
