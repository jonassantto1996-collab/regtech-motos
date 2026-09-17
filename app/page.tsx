import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/catalog/ProductCard";
import { listProducts } from "@/lib/catalog/queries";
import { getPublicImageUrl } from "@/lib/supabase/storage";

// Quantidade de produtos mostrados na seção "Encontre sua próxima moto".
const FEATURED_LIMIT = 4;

const WHY_ITEMS = [
  {
    title: "Mobilidade elétrica",
    description: "Motos elétricas pensadas para o seu dia a dia.",
  },
  {
    title: "Modelos disponíveis",
    description:
      "Conheça os modelos disponíveis no catálogo da Regtech Motors.",
  },
  {
    title: "Atendimento pelo WhatsApp",
    description: "Fale diretamente com a equipe pelo WhatsApp.",
  },
  {
    title: "Atendimento especializado",
    description:
      "Conte com nossa equipe para tirar suas dúvidas e te ajudar a escolher.",
  },
];

export default async function Home() {
  // Mesma consulta usada pelo catálogo público (lib/catalog/queries.ts) —
  // sem criar uma consulta nova. Página 1, ordenado pelos mais recentes.
  const { products, totalCount } = await listProducts({
    sort: "recent",
    page: 1,
  });

  const featuredProducts = products.slice(0, FEATURED_LIMIT);
  const heroProduct = featuredProducts[0];
  const heroImage = heroProduct?.product_images[0];
  const hasMoreProducts = totalCount > featuredProducts.length;

  return (
    <>
      <Header />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-slate-950">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-40 top-1/2 h-[36rem] w-[36rem] -translate-y-1/2 rounded-full bg-blue-600/20 blur-3xl"
          />

          <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-28">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
                Mobilidade elétrica
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Mais liberdade para se movimentar
              </h1>
              <p className="mt-6 max-w-md text-base text-slate-300 sm:text-lg">
                Motos elétricas para uma nova experiência de mobilidade.
                Conheça os modelos disponíveis na Regtech Motors.
              </p>
              <Link
                href="/products"
                className="mt-8 inline-flex items-center gap-2 bg-white px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-slate-950 transition hover:bg-cyan-300"
              >
                Ver motos
              </Link>
            </div>

            <div className="relative">
              {heroProduct && heroImage ? (
                <>
                  <div className="relative aspect-[4/3] w-full">
                    <div
                      aria-hidden
                      className="absolute inset-0 -z-10 rounded-full bg-cyan-400/10 blur-3xl"
                    />
                    <Image
                      src={getPublicImageUrl(heroImage.storage_path)}
                      alt={
                        heroImage.alt_text ||
                        `${heroProduct.brand} ${heroProduct.model}`
                      }
                      fill
                      priority
                      className="object-contain drop-shadow-2xl"
                      sizes="(max-width: 1024px) 90vw, 45vw"
                    />
                  </div>
                  <p className="mt-4 text-center text-xs font-medium uppercase tracking-[0.15em] text-slate-400 lg:text-left">
                    {heroProduct.brand} · {heroProduct.model}
                  </p>
                </>
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <p className="max-w-[16rem] text-center text-sm text-slate-400">
                    Confira os modelos disponíveis no catálogo da Regtech
                    Motors.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* PRODUTOS EM DESTAQUE */}
        <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Encontre sua próxima moto
              </h2>
              <p className="mt-3 text-gray-600">
                Conheça alguns dos modelos disponíveis na Regtech Motors.
              </p>
            </div>

            {featuredProducts.length > 0 ? (
              <>
                <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                  {featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {hasMoreProducts && (
                  <div className="mt-12 flex justify-center">
                    <Link
                      href="/products"
                      className="border border-gray-300 px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-gray-900 transition hover:border-blue-700 hover:text-blue-700"
                    >
                      Ver todo o catálogo
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-10 text-gray-500">
                Nenhum modelo disponível no momento.
              </p>
            )}
          </div>
        </section>

        {/* POR QUE REGTECH MOTORS */}
        <section className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Por que Regtech Motors
            </h2>

            <div className="mt-10 grid grid-cols-1 divide-y divide-gray-200 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              {WHY_ITEMS.map((item, index) => (
                <div key={item.title} className="py-6 sm:px-6 sm:py-0 sm:first:pl-0">
                  <span className="text-sm font-medium text-blue-700/50">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="bg-gradient-to-br from-blue-800 via-slate-950 to-slate-950 px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Pronto para conhecer as opções?
            </h2>
            <p className="mt-4 text-slate-300">
              Confira nosso catálogo e encontre o modelo que mais combina com
              você.
            </p>
            <Link
              href="/products"
              className="mt-8 inline-flex items-center gap-2 bg-white px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-slate-950 transition hover:bg-cyan-300"
            >
              Explorar catálogo
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
