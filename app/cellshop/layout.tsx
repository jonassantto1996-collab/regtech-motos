import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { WhatsAppIcon, MapPinIcon } from "@/components/icons/SiteIcons";
import { CELLSHOP, CELLSHOP_URL, MOTORS_URL, getCellshopBase, isCellshopHost } from "@/lib/cellshop/config";

/**
 * Layout da Regtech Cell Shop (loja de tecnologia). Fica fora do grupo (site)
 * para ter cabeçalho, rodapé e identidade próprios, sem mexer no site das motos.
 */
export async function generateMetadata(): Promise<Metadata> {
  // Só indexa no domínio próprio. Nas prévias e no domínio das motos, fica fora do Google.
  const ownDomain = await isCellshopHost();
  return {
    metadataBase: new URL(CELLSHOP_URL),
    title: {
      default: "Regtech Cell Shop | Celulares, Starlink e acessórios em Tucumã, PA",
      template: "%s | Regtech Cell Shop",
    },
    description:
      "Smartphones, tablets, carregadores, Bombox, Starlink e acessórios na Regtech Cell Shop, em Tucumã, Pará. Simule as parcelas e compre pelo WhatsApp.",
    robots: ownDomain ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { siteName: "Regtech Cell Shop", locale: "pt_BR", type: "website" },
  };
}

const NAV_LINK =
  "inline-flex min-h-11 items-center text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-slate-300 transition-colors hover:text-[#22d3ee] focus-visible:outline-none focus-visible:text-[#22d3ee] sm:text-xs";

export default async function CellshopLayout({ children }: { children: ReactNode }) {
  const base = await getCellshopBase();
  const home = base || "/";

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070a12]/95 text-white backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-5 px-4 sm:min-h-20 sm:px-6 lg:px-8">
          <Link href={home} aria-label="Regtech Cell Shop — início" className="shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]">
            <Image src="/cellshop-logo.svg" alt="Regtech Cell Shop" width={1439} height={418} priority unoptimized className="h-9 w-auto sm:h-11" />
          </Link>
          <nav aria-label="Navegação principal" className="flex items-center gap-5 sm:gap-8">
            <Link href={base ? `${base}#vitrine` : "/#vitrine"} className={`${NAV_LINK} hidden sm:inline-flex`}>
              Produtos
            </Link>
            <a href={MOTORS_URL} className={NAV_LINK}>
              Motos
            </a>
            <a
              href={CELLSHOP.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-[#22d3ee] hover:text-[#22d3ee]"
            >
              <WhatsAppIcon className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </nav>
        </div>
      </header>

      {children}

      <footer className="border-t border-white/10 bg-[#070a12] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8 lg:py-16">
          <div>
            <Image src="/cellshop-logo.svg" alt="Regtech Cell Shop" width={1439} height={418} unoptimized className="h-11 w-auto" />
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
              Smartphones, tablets, carregadores, Bombox, Starlink e acessórios em Tucumã, Pará. Uma loja Regtech, com mais de 14 anos de mercado.
            </p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-slate-500">Atendimento</p>
            <a href={CELLSHOP.whatsapp} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-[#22d3ee]">
              <WhatsAppIcon className="h-4 w-4" /> {CELLSHOP.telephone}
            </a>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-400">
              {CELLSHOP.openingHours.map((h) => (
                <li key={h.label}>{h.label}: {h.hours}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-slate-500">Loja física</p>
            <a href={CELLSHOP.mapUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-start gap-2 text-sm leading-6 text-slate-300 hover:text-[#22d3ee]">
              <MapPinIcon className="mt-1 h-4 w-4 shrink-0" />
              <span>{CELLSHOP.streetAddress}, Centro<br />{CELLSHOP.addressLocality}, {CELLSHOP.addressRegion} · CEP {CELLSHOP.postalCode}</span>
            </a>
            <a href={MOTORS_URL} className="mt-5 block text-sm font-semibold text-white hover:text-[#22d3ee]">
              Conheça também a Regtech Motors →
            </a>
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-slate-500 sm:px-6 lg:px-8">
            © {new Date().getFullYear()} Regtech Cell Shop · Regtech Celulares e Informática LTDA
          </p>
        </div>
      </footer>

      <a
        href={CELLSHOP.whatsapp}
        target="_blank"
        rel="noreferrer"
        aria-label="Falar com a Regtech Cell Shop no WhatsApp"
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#15803d] text-white shadow-[0_12px_30px_-8px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-0.5 sm:hidden"
      >
        <WhatsAppIcon className="h-7 w-7" />
      </a>
    </div>
  );
}
