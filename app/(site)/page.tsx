import Link from "next/link";
import ProductCard from "@/components/catalog/ProductCard";
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
      {/* HERO — peça de campanha compacta. */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-900 to-blue-950">
        <div className="hero-media-enter pointer-events-none absolute inset-0">
          {heroProduct && heroImage && (
            <HeroMedia
              imageUrl={getPublicImageUrl(heroImage.storage_path)}
              imageAlt={
                heroImage.alt_text ||
                `${heroProduct.brand} ${heroProduct.model}`
              }
              priority
              className="object-contain object-[82%_100%] sm:object-[78%_88%] lg:object-[85%_center]"
            />
          )}
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-950/60 to-transparent"
        />

        <div className="relative mx-auto flex max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:min-h-[26rem] lg:items-center lg:px-8 lg:py-0">
          <div className="hero-copy-enter max-w-xs sm:max-w-sm lg:max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
              Regtech Motors
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-blue-200">
              Mobilidade elétrica
            </p>
            <h1 className="mt-3 text-2xl font-bold leading-[1.08] tracking-[-0.025em] text-white sm:text-3xl lg:text-[2.75rem]">
              Conheça nossa linha de motos elétricas.
            </h1>
            <Link
              href="/products"
              className="mt-7 inline-flex min-h-12 items-center gap-3 border border-white bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-blue-950 transition-colors hover:border-cyan-300 hover:bg-cyan-300 sm:text-sm"
            >
              Conhecer modelos
              <span aria-hidden className="text-base">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* LINHA DE MOTOS */}
      <section className="bg-white px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-28 lg:pt-20">
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
              <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 lg:mt-10 lg:gap-x-12 lg:gap-y-20">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="mt-14 flex sm:justify-end lg:mt-16">
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
