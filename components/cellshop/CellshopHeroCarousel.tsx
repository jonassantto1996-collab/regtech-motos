"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export type HeroBannerImage = { src: string; width: number | null; height: number | null };

export type HeroBanner = {
  id: string;
  title: string;
  href: string | null;
  desktop: HeroBannerImage;
  tablet: HeroBannerImage;
  mobile: HeroBannerImage;
};

type Props = {
  /** Primeiro slide: o texto da loja. */
  intro: ReactNode;
  banners: HeroBanner[];
  /** Proporção (largura / altura) da caixa em cada tela, tirada dos banners. */
  ratios: { desktop: number; tablet: number; mobile: number };
  interval?: number;
};

/**
 * Topo da loja: o texto da loja e depois os banners, girando sozinhos sem fim.
 * Pausa quando o cliente passa o mouse, toca, navega pelo teclado ou troca de aba.
 * Cada banner tem a imagem certa para computador, tablet e celular.
 */
export default function CellshopHeroCarousel({ intro, banners, ratios, interval = 6000 }: Props) {
  const total = banners.length + 1;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const slidesRef = useRef<(HTMLDivElement | null)[]>([]);
  const touch = useRef<{ x: number; y: number; swiped: boolean } | null>(null);

  const go = useCallback((index: number) => setActive(((index % total) + total) % total), [total]);
  const running = !paused && !hovering && !focused && !hidden && !reduceMotion && total > 1;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => go(active + 1), interval);
    return () => window.clearTimeout(timer);
  }, [active, running, interval, go]);

  // Slides escondidos não recebem foco nem clique (React 18 ainda não tem a prop "inert").
  useEffect(() => {
    slidesRef.current.forEach((el, i) => {
      if (!el) return;
      if (i === active) el.removeAttribute("inert");
      else el.setAttribute("inert", "");
    });
  }, [active]);

  const style = {
    "--ar-desktop": String(ratios.desktop),
    "--ar-tablet": String(ratios.tablet),
    "--ar-mobile": String(ratios.mobile),
    "--cs-hero-interval": `${interval}ms`,
  } as CSSProperties;

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques da loja"
      className="relative isolate overflow-hidden bg-[#070a12] text-white"
      // Só o mouse pausa ao passar por cima (no celular o toque não "sai" do carrossel).
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHovering(false)}
      // Pausa quando navega pelo teclado; tocar num botão não deixa o carrossel parado.
      onFocus={(e) => setFocused((e.target as HTMLElement).matches(":focus-visible"))}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(active + 1);
        if (e.key === "ArrowLeft") go(active - 1);
      }}
    >
      <div
        className="cs-hero-stage grid"
        style={style}
        onTouchStart={(e) => {
          const t = e.touches[0];
          touch.current = { x: t.clientX, y: t.clientY, swiped: false };
          setHovering(true);
        }}
        onTouchEnd={(e) => {
          const start = touch.current;
          setHovering(false);
          if (!start) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - start.x;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(t.clientY - start.y)) {
            start.swiped = true;
            go(dx < 0 ? active + 1 : active - 1);
          }
        }}
        onTouchCancel={() => {
          // Gesto interrompido pelo navegador: solta a pausa do toque.
          touch.current = null;
          setHovering(false);
        }}
        onClickCapture={(e) => {
          // Um arraste para o lado troca o slide; não abre o link do banner.
          if (touch.current?.swiped) {
            e.preventDefault();
            e.stopPropagation();
          }
          touch.current = null;
        }}
      >
        {[intro, ...banners].map((slide, index) => {
          const isActive = index === active;
          const banner = index === 0 ? null : (slide as HeroBanner);
          return (
            <div
              key={banner?.id ?? "intro"}
              ref={(el) => {
                slidesRef.current[index] = el;
              }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${total}${banner ? `: ${banner.title}` : ""}`}
              aria-hidden={!isActive}
              className={`relative col-start-1 row-start-1 transition-opacity duration-700 ease-out motion-reduce:transition-none ${
                isActive ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
              }`}
            >
              {banner ? <BannerSlide banner={banner} eager={index === 1} /> : (slide as ReactNode)}
            </div>
          );
        })}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(active - 1)}
            aria-label="Slide anterior"
            className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#22d3ee] sm:flex lg:left-5"
          >
            <Chevron direction="left" />
          </button>
          <button
            type="button"
            onClick={() => go(active + 1)}
            aria-label="Próximo slide"
            className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#22d3ee] sm:flex lg:right-5"
          >
            <Chevron direction="right" />
          </button>

          <div className="absolute inset-x-0 bottom-2 z-20 flex items-center justify-center gap-1 sm:bottom-4">
            <div className="flex items-center rounded-full bg-black/35 px-1.5 ring-1 ring-white/15 backdrop-blur">
              {Array.from({ length: total }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Ir para o slide ${i + 1}`}
                  aria-current={i === active ? "true" : undefined}
                  className="group flex h-9 items-center px-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#22d3ee]"
                >
                  <span
                    className={`relative block h-1.5 overflow-hidden rounded-full transition-all duration-300 ${
                      i === active ? "w-8 bg-white/30" : "w-1.5 bg-white/55 group-hover:bg-white"
                    }`}
                  >
                    {i === active && (
                      <span
                        key={`${active}-${running}`}
                        className={`absolute inset-0 rounded-full bg-white ${running ? "cs-hero-progress" : ""}`}
                      />
                    )}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? "Continuar girando os slides" : "Pausar os slides"}
                className="ml-0.5 flex h-9 w-9 items-center justify-center text-white/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#22d3ee]"
              >
                {paused ? (
                  <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor"><path d="M4 2.5v11l9-5.5z" /></svg>
                ) : (
                  <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" /></svg>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function BannerPicture({ banner, eager, className, alt }: { banner: HeroBanner; eager: boolean; className: string; alt: string }) {
  return (
    <picture>
      <source media="(min-width: 1024px)" srcSet={banner.desktop.src} width={banner.desktop.width ?? undefined} height={banner.desktop.height ?? undefined} />
      <source media="(min-width: 640px)" srcSet={banner.tablet.src} width={banner.tablet.width ?? undefined} height={banner.tablet.height ?? undefined} />
      <img
        src={banner.mobile.src}
        width={banner.mobile.width ?? undefined}
        height={banner.mobile.height ?? undefined}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={className}
      />
    </picture>
  );
}

/**
 * O banner aparece inteiro, sem cortar a arte. Se a caixa ficar com outro
 * formato (ex.: um banner com proporção diferente dos outros), o espaço que
 * sobra é preenchido pela própria imagem desfocada, sem faixas pretas.
 */
function BannerSlide({ banner, eager }: { banner: HeroBanner; eager: boolean }) {
  const content = (
    <>
      <BannerPicture banner={banner} eager={eager} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" />
      <BannerPicture banner={banner} eager={eager} alt={banner.title} className="absolute inset-0 h-full w-full object-contain" />
    </>
  );
  return banner.href ? (
    <a href={banner.href} aria-label={banner.title} className="absolute inset-0 block overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#22d3ee]">
      {content}
    </a>
  ) : (
    <div className="absolute inset-0 overflow-hidden">{content}</div>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {direction === "left" ? <path d="M12.5 4.5 7 10l5.5 5.5" /> : <path d="M7.5 4.5 13 10l-5.5 5.5" />}
    </svg>
  );
}
