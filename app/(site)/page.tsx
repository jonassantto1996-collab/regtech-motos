import Link from "next/link";
import HomeProductCard from "@/components/home/HomeProductCard";
import HeroMedia from "@/components/home/HeroMedia";
import { listProducts } from "@/lib/catalog/queries";
import { getPublicImageUrl } from "@/lib/supabase/storage";

// Quantidade de produtos mostrados na seção "Motos".
const FEATURED_LIMIT = 4;

export default async function Home() {
  // Mesma consulta usada pelo catálogo público (lib/catalog/queries.ts) —
  // sem criar uma consulta nova. Página 1, ordenado pelos mais recentes.
  const { products } = await listProducts({
    sort: "recent",
    page: 1,
  });

  const featuredProducts = products.slice(0, FEATURED_LIMIT);

  // Hero: produto em destaque (o mais recente).
  const heroProduct = featuredProducts[0];
  const heroImage = heroProduct?.product_images[0];

  return (
    <main>
      {/* HERO — campanha principal da vertical Motors. */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-900 to-blue-950">
        <div className="hero-media-enter pointer-events-none absolute inset-0">
          {heroProduct && heroImage && (
            <HeroMedia
              imageUrl={getPublicImageUrl(heroImage.storage_path)}
              imageAlt={
                heroImage.alt_text ||
                `${heroProduct.brand} ${heroProduct.model}`
              }
              priority
              className="object-contain object-[86%_100%] sm:object-[82%_92%] lg:object-[82%_center]"
            />
          )}
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-950/70 to-blue-900/10"
        />

        <div className="relative mx-auto flex min-h-[25rem] max-w-7xl items-end px-4 pb-10 pt-20 sm:min-h-[30rem] sm:px-6 sm:pb-14 sm:pt-24 lg:min-h-[34rem] lg:items-center lg:px-8 lg:py-0">
          <div className="hero-copy-enter max-w-sm sm:max-w-md lg:max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
              Regtech Motors
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-blue-200">
              Mobilidade elétrica
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-[1.04] tracking-[-0.035em] text-white sm:text-4xl lg:text-6xl">
              Mobilidade elétrica para o seu próximo caminho.
            </h1>
            <Link
              href="/products"
              className="mt-8 inline-flex min-h-12 items-center gap-3 border border-white bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-blue-950 transition-colors hover:border-cyan-300 hover:bg-cyan-300 sm:text-sm"
            >
              Conhecer modelos
              <span aria-hidden className="text-base">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* NAVEGAÇÃO DA VERTICAL — baseada apenas em categorias reais do catálogo. */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid min-h-24 grid-cols-[1fr_auto] items-center gap-6 py-5 sm:min-h-28">
            <div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-blue-700">
                Explore a linha
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
                {Array.from(
                  new Set(featuredProducts.map((product) => product.category))
                ).map((category) => (
                  <Link
                    key={category}
                    href={`/products?category=${encodeURIComponent(category)}`}
                    className="text-sm font-semibold text-gray-900 transition-colors hover:text-blue-700 sm:text-base"
                  >
                    {category}
                  </Link>
                ))}
                <Link
                  href="/products"
                  className="text-sm font-medium text-gray-500 transition-colors hover:text-blue-700 sm:text-base"
                >
                  Todos os modelos
                </Link>
              </div>
            </div>

            <Link
              href="/products"
              aria-label="Abrir catálogo de motos elétricas"
              className="inline-flex h-11 w-11 items-center justify-center border border-gray-300 text-xl text-gray-900 transition-colors hover:border-blue-700 hover:bg-blue-700 hover:text-white"
            >
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* LINHA DE MOTOS */}
      <section className="bg-white px-4 pb-14 pt-10 sm:px-6 sm:pt-12 lg:px-8 lg:pb-20 lg:pt-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 border-b border-gray-200 pb-7 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">
                Linha de motos
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Modelos disponíveis
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-gray-600 sm:text-right">
              Escolha o modelo que combina com a sua forma de se movimentar.
            </p>
          </div>

          {featuredProducts.length > 0 ? (
            <>
              <div className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 sm:gap-7 lg:grid lg:grid-cols-4 lg:gap-0 lg:overflow-visible lg:pb-0">
                {featuredProducts.map((product) => (
                  <HomeProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="mt-10 flex sm:justify-end lg:mt-12">
                <Link
                  href="/products"
                  className="inline-flex min-h-12 w-full items-center justify-center border border-gray-900 px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-gray-900 transition-colors hover:bg-gray-900 hover:text-white sm:w-auto"
                >
                  Ver todas as motos
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-10 text-gray-500">
              Nenhum modelo disponível no momento.
            </p>
          )}
        </div>
      </section>

      {/* REGTECH — fechamento institucional curto, sem repetir fotografia. */}
      <section className="border-t border-blue-900 bg-blue-950 px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:gap-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
              Regtech Motors
            </p>
            <h2 className="mt-3 max-w-md text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Tecnologia para uma nova forma de se movimentar.
            </h2>
          </div>

          <div className="border-t border-blue-800 pt-7 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
            <p className="max-w-xl text-base leading-7 text-blue-100 sm:text-lg">
              Conheça nossa linha de motos elétricas, compare os modelos
              disponíveis e fale diretamente com a equipe Regtech para tirar
              suas dúvidas.
            </p>
            <Link
              href="/products"
              className="mt-7 inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:text-cyan-300"
            >
              Explorar catálogo
              <span aria-hidden className="text-lg">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
