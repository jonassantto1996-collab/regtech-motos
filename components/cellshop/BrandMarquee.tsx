import { BRAND_LOGOS } from "@/lib/cellshop/brand-logos";

/**
 * Faixa com os logos das marcas, passando sem parar (carrossel infinito).
 * Para no passar do mouse; quem pede menos movimento no aparelho vê a faixa parada.
 */
export default function BrandMarquee() {
  // Quatro cópias: a animação anda meia faixa e recomeça sem emenda, até em telas largas.
  const strip = [...BRAND_LOGOS, ...BRAND_LOGOS, ...BRAND_LOGOS, ...BRAND_LOGOS];
  return (
    <section aria-label="Marcas da loja" className="border-t border-white/10 bg-[#070a12] text-white">
      <p className="sr-only">Marcas que você encontra na Regtech Cell Shop: {BRAND_LOGOS.map((b) => b.name).join(", ")}.</p>
      <div className="cs-marquee relative overflow-hidden py-6 sm:py-7 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
        <ul aria-hidden className="cs-marquee-track flex w-max items-center">
          {strip.map((logo, i) => (
            <li key={`${logo.name}-${i}`} className="flex shrink-0 items-center px-8 sm:px-12">
              <svg
                viewBox={logo.viewBox}
                width={logo.width}
                height={logo.height}
                fill="currentColor"
                className="text-white/55 transition-colors duration-300 hover:text-white"
                focusable="false"
              >
                <path d={logo.d} fillRule={logo.evenOdd ? "evenodd" : undefined} />
              </svg>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
