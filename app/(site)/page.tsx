import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/catalog/ProductCard";
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

  // Seção institucional: usa um segundo produto real (quando existir) como
  // fotografia de apoio, diferente da foto usada no Hero — sem repetir a
  // mesma composição duas vezes seguidas na página.
  const institutionalProduct = featuredProducts[1] ?? featuredProducts[0];
  const institutionalImage = institutionalProduct?.product_images[0];

  return (
    <main>
      {/* HERO — composição editorial: no mobile a moto vem em bloco
          grande, logo no início, antes do texto (protagonismo visual
          imediato). No desktop (lg+) a moto passa a sangrar até a borda
          direita da viewport, com o texto num bloco mais estreito à
          esquerda — composição assimétrica, não duas colunas iguais. */}
      <section className="relative overflow-hidden bg-blue-950 lg:min-h-[38rem]">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-3xl"
        />

        {/* Moto em bleed — só existe no desktop; no mobile a moto aparece
            em bloco próprio logo abaixo. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 lg:block">
          {heroProduct && heroImage && (
            <Image
              src={getPublicImageUrl(heroImage.storage_path)}
              alt={
                heroImage.alt_text ||
                `${heroProduct.brand} ${heroProduct.model}`
              }
              fill
              className="object-contain object-right p-8 xl:p-14"
              sizes="50vw"
            />
          )}
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Moto — bloco mobile/tablet, grande, antes do texto. */}
          <div className="relative mt-6 aspect-square w-full sm:aspect-[3/2] md:aspect-[16/9] lg:hidden">
            {heroProduct && heroImage ? (
              <Image
                src={getPublicImageUrl(heroImage.storage_path)}
                alt={
                  heroImage.alt_text ||
                  `${heroProduct.brand} ${heroProduct.model}`
                }
                fill
                priority
                className="object-contain"
                sizes="100vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <p className="max-w-[16rem] text-center text-sm text-blue-200">
                  Confira os modelos disponíveis no catálogo da Regtech
                  Motors.
                </p>
              </div>
            )}
          </div>

          <div className="py-8 lg:max-w-sm lg:py-28">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
              Regtech Motors · Mobilidade elétrica
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Mais liberdade para se movimentar
            </h1>
            <p className="mt-6 max-w-md text-base text-blue-100 sm:text-lg lg:max-w-none">
              Motos elétricas para uma nova experiência de mobilidade.
              Conheça os modelos disponíveis na Regtech Motors.
            </p>
            <Link
              href="/products"
              className="mt-8 inline-flex items-center gap-2 bg-white px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-blue-950 transition hover:bg-cyan-300"
            >
              Conhecer motos
            </Link>
          </div>
        </div>
      </section>

      {/* MOTOS — primeira vertical da Regtech */}
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">
              Motos
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Conheça nossa linha de motos elétricas.
            </h2>
          </div>

          {featuredProducts.length > 0 ? (
            <>
              <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="mt-12 flex justify-center">
                <Link
                  href="/products"
                  className="border border-gray-300 px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-gray-900 transition hover:border-blue-700 hover:text-blue-700"
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

      {/* APRESENTAÇÃO DA REGTECH — bloco editorial (foto + texto curto) */}
      <section className="bg-blue-950">
        <div className="mx-auto grid max-w-6xl grid-cols-1 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[4/3] w-full lg:aspect-auto lg:h-full lg:min-h-[24rem]">
            {institutionalProduct && institutionalImage ? (
              <Image
                src={getPublicImageUrl(institutionalImage.storage_path)}
                alt={
                  institutionalImage.alt_text ||
                  `${institutionalProduct.brand} ${institutionalProduct.model}`
                }
                fill
                className="object-contain p-8 sm:p-12"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="h-full w-full bg-white/5" />
            )}
          </div>

          <div className="px-4 py-16 sm:px-6 lg:px-12 lg:py-0">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Uma nova forma de se movimentar.
            </h2>
            <p className="mt-4 max-w-md text-blue-100">
              A Regtech Motors apresenta motos elétricas pensadas para uma
              nova experiência de mobilidade. Fale com a gente pelo
              WhatsApp para conhecer o modelo ideal para você.
            </p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-950 px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Pronto para conhecer as opções?
          </h2>
          <p className="mt-4 text-blue-100">
            Confira nosso catálogo e encontre o modelo que mais combina com
            você.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex items-center gap-2 bg-white px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-blue-950 transition hover:bg-cyan-300"
          >
            Explorar catálogo
          </Link>
        </div>
      </section>
    </main>
  );
}
