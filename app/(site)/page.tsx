import Image from "next/image";
import Link from "next/link";
import HomeProductCard from "@/components/home/HomeProductCard";
import HeroMedia from "@/components/home/HeroMedia";
import ContactRider from "@/components/home/ContactRider";
import { ExternalLinkIcon, WhatsAppIcon } from "@/components/icons/SiteIcons";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { getActiveProductListItemById, listProducts } from "@/lib/catalog/queries";
import { createClient } from "@/lib/supabase/server";
import { getHomeMediaUrl, getPublicImageUrl } from "@/lib/supabase/storage";

const STORE_WHATSAPP_CONTACTS = [
  {
    label: "Atendimento Regtech Motors",
    phone: "+55 94 99282-8523",
    href: "https://wa.me/5594992828523",
  },
  {
    label: "Atendimento Regtech Cell Shop",
    phone: "+55 94 99298-9833",
    href: "https://wa.me/5594992989833",
  },
] as const;

const STORE_INSTAGRAM_CONTACTS = [
  {
    label: "Instagram Regtech Motors",
    handle: "@regtechmotors",
    href: "https://www.instagram.com/regtechmotors",
  },
  {
    label: "Instagram Regtech Cell Shop",
    handle: "@regtechcellshop",
    href: "https://www.instagram.com/regtechcellshop",
  },
] as const;

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

  const featuredGridClass =
    featuredProducts.length === 1
      ? "lg:grid-cols-1 lg:max-w-2xl lg:mx-auto"
      : featuredProducts.length === 2
        ? "lg:grid-cols-2 lg:max-w-6xl lg:mx-auto lg:gap-12"
        : featuredProducts.length === 3
          ? "lg:grid-cols-3 lg:max-w-7xl lg:mx-auto lg:gap-8"
          : "lg:grid-cols-4 lg:gap-7";

  // Hero configurável pelo painel: imagem exclusiva, produto escolhido
  // ou fallback automático para o produto mais recente.
  const supabase = await createClient();
  const [{ data: heroSettings }, { data: socialProof }, { data: editorialSettings }] = await Promise.all([
    supabase
      .from("home_hero_settings")
      .select("mode, product_id, storage_path, alt_text, image_position")
      .eq("id", true)
      .maybeSingle(),
    supabase
      .from("home_social_proof")
      .select("id,customer_name,city,product_name,testimonial,storage_path,alt_text")
      .eq("is_active", true)
      .eq("publication_authorized", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("home_editorial_settings")
      .select("eyebrow,title,description,cta_label,cta_href,storage_path,alt_text,image_position,image_position_x,image_position_y,is_active")
      .eq("id", true)
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  const socialProofGridClass =
    socialProof?.length === 1
      ? "sm:grid-cols-1 sm:max-w-sm sm:mx-auto"
      : socialProof?.length === 2
        ? "sm:grid-cols-2 lg:max-w-3xl lg:mx-auto"
        : socialProof?.length === 3
          ? "sm:grid-cols-2 lg:grid-cols-3 lg:max-w-6xl lg:mx-auto lg:gap-7"
          : socialProof?.length === 4
            ? "sm:grid-cols-2 lg:grid-cols-4"
            : "sm:grid-cols-2 lg:grid-cols-5";

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
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/75 to-blue-900/10 sm:bg-gradient-to-r sm:from-blue-950 sm:via-blue-950/70 sm:to-blue-900/10"
        />

        <div className="relative mx-auto flex min-h-[34rem] max-w-7xl items-end px-4 pb-8 pt-24 sm:min-h-[30rem] sm:px-6 sm:pb-14 sm:pt-24 lg:min-h-[34rem] lg:items-center lg:px-8 lg:py-0">
          <div className="hero-copy-enter max-w-sm sm:max-w-md lg:max-w-xl">
            <Image
              src="/logo-regtech-motors.png"
              alt="Regtech Motors"
              width={201}
              height={96}
              priority
              className="h-10 w-auto sm:h-14 lg:h-16"
            />
            <p className="mt-4 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-blue-200 sm:mt-5 sm:text-xs sm:tracking-[0.2em]">
              Motos · Mobilidade elétrica
            </p>
            <h1 className="mt-4 text-[2.15rem] font-bold leading-[1.02] tracking-[-0.035em] text-white sm:text-4xl lg:text-6xl">
              Mobilidade elétrica para o seu próximo caminho.
            </h1>
            <Link
              href="/products"
              className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-3 border border-white bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-blue-950 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-950 active:translate-y-0 sm:mt-8 sm:w-auto sm:text-sm"
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
          <div className="grid min-h-20 grid-cols-[1fr_auto] items-center gap-4 py-4 sm:min-h-28 sm:gap-6 sm:py-5">
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
              className="inline-flex h-10 w-10 items-center justify-center border border-gray-300 text-lg text-gray-900 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-700 hover:bg-blue-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 active:translate-y-0 sm:h-11 sm:w-11 sm:text-xl"
            >
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* LINHA DE MOTOS */}
      <section className="bg-white px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-12 lg:px-8 lg:pb-20 lg:pt-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 border-b border-gray-200 pb-7 sm:flex-row sm:items-end sm:justify-between sm:pb-8 lg:pb-10">
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
              <div className={`mobile-snap-row mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 sm:mt-8 sm:gap-7 lg:grid lg:overflow-visible lg:pb-0 ${featuredGridClass}`}>
                {featuredProducts.map((product) => (
                  <HomeProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="mt-10 flex sm:justify-end lg:mt-10">
                <Link
                  href="/products"
                  className="inline-flex min-h-12 w-full items-center justify-center border border-gray-900 px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-gray-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 active:translate-y-0 sm:w-auto"
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

      {editorialSettings && (
        <section className="overflow-hidden bg-gray-950 text-white">
          <div className="mx-auto grid max-w-7xl lg:min-h-[34rem] lg:grid-cols-[0.92fr_1.08fr]">
            <div className="px-4 py-12 sm:px-6 sm:py-16 lg:flex lg:flex-col lg:justify-center lg:px-12 lg:py-24">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
                {editorialSettings.eyebrow}
              </p>
              <h2 className="mt-4 max-w-xl text-[2rem] font-bold leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">
                {editorialSettings.title}
              </h2>
              <p className="mt-5 max-w-xl text-[0.9375rem] leading-7 text-gray-300 sm:mt-6 sm:text-lg">
                {editorialSettings.description}
              </p>
              <Link
                href={editorialSettings.cta_href}
                className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-3 border border-white/30 px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-300 hover:text-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 active:translate-y-0 sm:mt-8 sm:w-auto sm:text-sm"
              >
                {editorialSettings.cta_label}
                <span aria-hidden className="text-base">→</span>
              </Link>
            </div>

            <div className="relative min-h-[26rem] overflow-hidden border-t border-white/10 bg-blue-950 sm:min-h-[28rem] lg:min-h-[34rem] lg:border-l lg:border-t-0">
              <Image
                src={editorialSettings.storage_path ? getHomeMediaUrl(editorialSettings.storage_path) : "/regtech-entrega-home.webp"}
                alt={editorialSettings.alt_text}
                fill
                quality={95}
                className="object-cover"
                style={{ objectPosition: `${editorialSettings.image_position_x ?? 50}% ${editorialSettings.image_position_y ?? 50}%` }}
                sizes="(max-width: 1023px) 100vw, 48vw"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-blue-950/55 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10">
                <div className="border-t border-white/30 pt-4">
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-white">
                    Entrega real · Regtech Motors
                  </p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-white/80">
                    Clientes que já escolheram a mobilidade elétrica.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* JORNADA — diferenciais baseados apenas no fluxo real do produto. */}
      <section className="border-b border-gray-200 bg-gray-50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 border-b border-gray-300 pb-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:pb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">
                Do catálogo ao atendimento
              </p>
              <h2 className="mt-3 max-w-lg text-[2rem] font-bold leading-[1.08] tracking-tight text-gray-950 sm:text-4xl">
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
                className="group py-8 first:pt-7 lg:px-10 lg:py-11 lg:first:pl-0 lg:last:pr-0"
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

      {socialProof && socialProof.length > 0 && (
        <section className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 border-b border-gray-200 pb-7 sm:flex-row sm:items-end sm:justify-between lg:pb-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">
                  Prova social
                </p>
                <h2 className="mt-3 text-[2rem] font-bold leading-[1.08] tracking-tight text-gray-950 sm:text-4xl">
                  Quem já escolheu a Regtech Motors.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-gray-600 sm:text-right">
                Entregas reais e clientes que já fazem parte da experiência Regtech.
              </p>
            </div>

            <div className={`mobile-snap-row mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 sm:mt-8 sm:grid sm:gap-5 sm:overflow-visible ${socialProofGridClass}`}>
              {socialProof.map((item) => (
                <article
                  key={item.id}
                  className="group min-w-[84vw] snap-center overflow-hidden border border-gray-200 bg-white transition-shadow duration-300 hover:shadow-lg sm:min-w-0 sm:snap-start"
                >
                  <div className="relative aspect-[4/5] bg-gray-100">
                    <Image
                      src={getPublicImageUrl(item.storage_path)}
                      alt={item.alt_text}
                      fill
                      className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.025]"
                      sizes="(max-width: 639px) 84vw, (max-width: 1023px) 50vw, 20vw"
                    />
                  </div>
                  <div className="p-4 lg:p-5">
                    <p className="text-sm font-semibold text-gray-950">{item.customer_name}</p>
                    <p className="mt-1 text-[0.6875rem] uppercase tracking-[0.14em] text-blue-700">
                      {[item.product_name, item.city].filter(Boolean).join(" · ")}
                    </p>
                    {item.testimonial && (
                      <p className="mt-3 text-sm leading-6 text-gray-600">“{item.testimonial}”</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* CANAIS OFICIAIS — mantém o hero intacto e concentra atendimento/social nesta área inferior. */}
      <section className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden border border-gray-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] lg:grid lg:grid-cols-[1.08fr_0.92fr]">
            <div className="px-5 py-9 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-blue-700">
                Canais oficiais
              </p>
              <h2 className="mt-3 max-w-xl text-[2rem] font-bold leading-[1.06] tracking-tight text-gray-950 sm:text-4xl lg:text-[2.8rem]">
                Fale com a equipe oficial da Regtech.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
                Atendimento direto para motos e loja. Escolha o canal ideal para falar com a equipe.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {STORE_WHATSAPP_CONTACTS.map((contact) => (
                  <a
                    key={contact.label}
                    href={contact.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex min-h-[10.5rem] flex-col justify-between border border-gray-200 bg-gray-50 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:bg-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                    aria-label={`Abrir WhatsApp — ${contact.label}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="inline-grid h-11 w-11 flex-none place-items-center rounded-full bg-emerald-100 text-emerald-600">
                        <WhatsAppIcon className="h-6 w-6" />
                      </span>
                      <ExternalLinkIcon className="h-4 w-4 flex-none text-gray-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                    </div>
                    <div className="mt-5">
                      <span className="block text-[0.6875rem] font-semibold uppercase tracking-[0.13em] text-gray-500">
                        {contact.label}
                      </span>
                      <span className="mt-2 block text-lg font-bold tracking-tight text-gray-950">
                        {contact.phone}
                      </span>
                      <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                        Falar no WhatsApp <span aria-hidden>→</span>
                      </span>
                    </div>
                  </a>
                ))}

                {STORE_INSTAGRAM_CONTACTS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex min-h-[10.5rem] flex-col justify-between border border-gray-200 bg-gray-50 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    aria-label={`Abrir ${social.label}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="inline-grid h-11 w-11 flex-none place-items-center rounded-full bg-blue-100 text-blue-700">
                        <InstagramIcon className="h-6 w-6" />
                      </span>
                      <ExternalLinkIcon className="h-4 w-4 flex-none text-gray-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-700" />
                    </div>
                    <div className="mt-5">
                      <span className="block text-[0.6875rem] font-semibold uppercase tracking-[0.13em] text-gray-500">
                        {social.label}
                      </span>
                      <span className="mt-2 block text-lg font-bold tracking-tight text-gray-950">
                        {social.handle}
                      </span>
                      <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                        Ver perfil <span aria-hidden>→</span>
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <ContactRider />
          </div>
        </div>
      </section>


    </main>
  );
}
