import Image from "next/image";
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

  // Seção institucional: usa um segundo produto real (quando existir) como
  // fotografia de apoio, diferente da foto usada no Hero — sem repetir a
  // mesma composição duas vezes seguidas na página.
  const institutionalProduct = featuredProducts[1] ?? featuredProducts[0];
  const institutionalImage = institutionalProduct?.product_images[0];

  return (
    <main>
      {/* HERO — peça de campanha compacta: a foto do produto cobre a
          seção inteira como camada de fundo (sem container/caixa própria
          — nada de "card" em volta dela), com o texto sobreposto num
          bloco curto. Bem mais baixo que a versão anterior; o objetivo é
          que "REGTECH + MOBILIDADE + PRODUTO" caibam juntos numa única
          leitura, e a seção Motos comece logo em seguida. */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-900 to-blue-950">
        {/* Foto do produto: preenche a seção inteira; a posição da moto
            visível dentro dela é controlada por object-position, não por
            um container próprio — é isso que evita a leitura de card. */}
        <div className="pointer-events-none absolute inset-0">
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

        {/* Scrim: garante contraste pro texto independente do que
            estiver por trás (foto ou só o gradiente de fundo). */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-950/55 to-transparent"
        />

        <div className="relative mx-auto flex max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:min-h-[26rem] lg:items-center lg:px-8 lg:py-0">
          <div className="max-w-xs sm:max-w-sm lg:max-w-md">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
              Regtech Motors
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-blue-200">
              Mobilidade elétrica
            </p>
            <h1 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
              Conheça nossa linha de motos elétricas.
            </h1>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-blue-950 transition hover:bg-cyan-300 sm:text-sm"
            >
              Conhecer modelos
            </Link>
          </div>
        </div>
      </section>

      {/* MOTOS — primeira vertical da Regtech. Padding de topo reduzido
          (era py-16/py-24) pra a seção começar logo depois do Hero, que
          agora é bem mais curto. Título também não repete mais a mesma
          frase do H1 do Hero — nesta etapa só reposicionamento/pequenos
          ajustes de entrada, sem redesenhar o ProductCard/grade. */}
      <section className="bg-white px-4 pb-16 pt-10 sm:px-6 sm:pt-12 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">
              Motos
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Modelos disponíveis
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
