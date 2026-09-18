import Link from "next/link";
import HomeProductCard from "@/components/home/HomeProductCard";
import HeroMedia from "@/components/home/HeroMedia";
import { getActiveProductListItemById, listProducts } from "@/lib/catalog/queries";
import { createClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/lib/supabase/storage";

const STORE_MAP_URL = "https://www.google.com/maps/search/?api=1&query=Av.%20dos%20Estados%2C%20241%2C%20Centro%2C%20Tucum%C3%A3%2C%20PA%2C%2068385-000";

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

  // Hero configurável pelo painel: imagem exclusiva, produto escolhido
  // ou fallback automático para o produto mais recente.
  const supabase = await createClient();
  const { data: heroSettings } = await supabase
    .from("home_hero_settings")
    .select("mode, product_id, storage_path, alt_text, image_position")
    .eq("id", true)
    .maybeSingle();

  const selectedHeroProduct =
    heroSettings?.mode === "product" && heroSettings.product_id
      ? await getActiveProductListItemById(heroSettings.product_id)
      : null;
  const heroProduct = selectedHeroProduct ?? featuredProducts[0];
  const heroImage = heroProduct?.product_images[0];
  const customHeroPath =
    heroSettings?.mode === "custom" ? heroSettings.storage_path : null;
  const heroImageUrl = customHeroPath
    ? getPublicImageUrl(customHeroPath)
    : heroImage
      ? getPublicImageUrl(heroImage.storage_path)
      : null;
  const heroPosition = heroSettings?.image_position ?? "center";
  const heroPositionClass =
    heroPosition === "left"
      ? "object-left"
      : heroPosition === "right"
        ? "object-right"
        : "object-center";
  const heroImageAlt = customHeroPath
    ? heroSettings?.alt_text || "Regtech Motors"
    : heroImage
      ? heroImage.alt_text || `${heroProduct?.brand ?? ""} ${heroProduct?.model ?? ""}`.trim()
      : "Regtech Motors";

  return (
    <main>
      {/* HERO — campanha principal da vertical Motors. */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-900 to-blue-950">
        <div className="hero-media-enter pointer-events-none absolute inset-0">
          {heroImageUrl && (
            <HeroMedia
              imageUrl={heroImageUrl}
              imageAlt={heroImageAlt}
              priority
              className={`object-cover ${heroPositionClass}`}
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

      {/* MOBILIDADE — bloco editorial, sem promessas técnicas não confirmadas. */}
      <section className="overflow-hidden bg-gray-950 text-white">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
          <div className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
              Mobilidade elétrica
            </p>
            <h2 className="mt-4 max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Uma nova experiência para se movimentar.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-gray-300 sm:text-lg">
              Explore os modelos elétricos disponíveis, conheça os detalhes de
              cada moto e escolha qual deseja consultar com a equipe Regtech.
            </p>
            <Link
              href="/products"
              className="mt-8 inline-flex min-h-12 items-center gap-3 border border-white/30 px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:border-cyan-300 hover:bg-cyan-300 hover:text-blue-950 sm:text-sm"
            >
              Comparar modelos
              <span aria-hidden className="text-base">→</span>
            </Link>
          </div>

          <div className="relative min-h-64 border-t border-white/10 bg-gradient-to-br from-blue-800 via-blue-950 to-gray-950 sm:min-h-80 lg:min-h-full lg:border-l lg:border-t-0">
            <div aria-hidden className="absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-blue-500/20 blur-3xl sm:h-96 sm:w-96" />
            <div className="relative flex h-full min-h-64 items-end p-6 sm:min-h-80 sm:p-8 lg:min-h-full lg:p-10">
              <div className="w-full border-t border-white/20 pt-5">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-blue-200">
                  Regtech Motors
                </p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-white/80">
                  Catálogo digital conectado diretamente ao atendimento da loja.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* JORNADA — diferenciais baseados apenas no fluxo real do produto. */}
      <section className="border-b border-gray-200 bg-gray-50 px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 border-b border-gray-300 pb-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">
                Do catálogo ao atendimento
              </p>
              <h2 className="mt-3 max-w-lg text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                Uma jornada simples para conhecer sua próxima moto.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-gray-600 lg:justify-self-end">
              Navegue pelos modelos disponíveis, consulte os detalhes e envie
              seu interesse diretamente para o atendimento da Regtech.
            </p>
          </div>

          <div className="grid divide-y divide-gray-300 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {[
              {
                number: "01",
                title: "Explore os modelos",
                text: "Veja as motos elétricas disponíveis no catálogo e acesse cada modelo para conhecer seus detalhes.",
              },
              {
                number: "02",
                title: "Escolha seu interesse",
                text: "Ao encontrar uma moto, informe seu nome e WhatsApp para iniciar o contato.",
              },
              {
                number: "03",
                title: "Fale com a Regtech",
                text: "Seu interesse é registrado e a conversa continua diretamente pelo WhatsApp.",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="group py-8 first:pt-7 lg:px-8 lg:py-9 lg:first:pl-0 lg:last:pr-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-[0.2em] text-blue-700">
                    {item.number}
                  </span>
                  <span
                    aria-hidden
                    className="h-px w-10 bg-gray-300 transition-all duration-300 group-hover:w-14 group-hover:bg-blue-600"
                  />
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-tight text-gray-950">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-gray-600">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOJA — dados institucionais confirmados pelo cliente. */}
      <section className="bg-white px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid overflow-hidden border border-gray-200 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative flex min-h-[22rem] items-end overflow-hidden bg-gradient-to-br from-blue-700 via-blue-900 to-blue-950 p-7 text-white sm:min-h-[28rem] sm:p-10 lg:min-h-[34rem] lg:p-12">
              <div aria-hidden className="absolute -right-24 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-cyan-300/10 blur-3xl" />
              <div className="relative max-w-lg">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
                  Regtech CellShop
                </p>
                <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  Conheça a Regtech de perto.
                </h2>
                <p className="mt-5 max-w-md text-base leading-7 text-blue-100">
                  Visite a loja física e conheça os modelos disponíveis com a
                  equipe Regtech.
                </p>
                <p className="mt-8 border-t border-white/20 pt-5 text-sm leading-6 text-white/85">
                  Av. dos Estados, 241 — Centro, Tucumã — PA
                  <br />
                  CEP 68385-000
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between bg-gray-50 p-7 sm:p-10 lg:p-12">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">
                  Canais oficiais
                </p>
                <h3 className="mt-3 max-w-md text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                  Continue sua experiência com a Regtech.
                </h3>
              </div>

              <div className="mt-10 divide-y divide-gray-300 border-y border-gray-300">
                <a
                  href="https://www.instagram.com/regtechcellshop"
                  target="_blank"
                  rel="noreferrer"
                  className="group flex min-h-20 items-center justify-between gap-5 py-5"
                >
                  <div>
                    <span className="block text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Instagram
                    </span>
                    <span className="mt-1 block text-base font-semibold text-gray-950">
                      @regtechcellshop
                    </span>
                  </div>
                  <span
                    aria-hidden
                    className="text-xl text-blue-700 transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </a>

                <a
                  href={STORE_MAP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex min-h-20 items-center justify-between gap-5 py-5"
                >
                  <div>
                    <span className="block text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Loja física
                    </span>
                    <span className="mt-1 block text-base font-semibold text-gray-950">
                      Av. dos Estados, 241 — Centro, Tucumã — PA
                    </span>
                  </div>
                  <span aria-hidden className="text-xl text-blue-700 transition-transform group-hover:translate-x-1">→</span>
                </a>
              </div>

              <p className="mt-8 text-sm leading-6 text-gray-600">
                Consulte os modelos pelo catálogo digital ou visite a loja física em Tucumã.
              </p>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
