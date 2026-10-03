import Link from "next/link";
import BrandLogo from "@/components/layout/BrandLogo";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { ExternalLinkIcon, MapPinIcon, WhatsAppIcon } from "@/components/icons/SiteIcons";
import { REGTECH_MOTORS } from "@/lib/seo/business";

const STORE_MAP_URL = REGTECH_MOTORS.mapUrl;

export default function Footer() {
  return (
    <footer className="border-t border-blue-900 bg-blue-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="grid gap-10 border-b border-blue-900 pb-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.6fr_1fr_0.9fr] lg:gap-12 lg:pb-12">
          <div>
            <Link
              href="/"
              className="inline-block outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              aria-label="Regtech Motors — início"
            >
              <BrandLogo className="h-10 sm:h-12" />
            </Link>
            <p className="mt-5 max-w-md text-sm leading-6 text-blue-200">
              Loja de motos e mobilidade em Tucumã, Pará. Conheça modelos elétricos e a combustão e fale com a equipe Regtech Motors.
            </p>
          </div>

          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-blue-300">
              Navegação
            </p>
            <nav aria-label="Navegação do rodapé" className="mt-5 flex flex-col items-start gap-3">
              <Link href="/" className="text-sm text-blue-100 transition-colors hover:text-cyan-300">
                Início
              </Link>
              <Link href="/products" className="text-sm text-blue-100 transition-colors hover:text-cyan-300">
                Motos
              </Link>
              <Link href="/loja" className="text-sm text-blue-100 transition-colors hover:text-cyan-300">
                Loja em Tucumã
              </Link>
            </nav>
          </div>

          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-blue-300">
              Canais oficiais
            </p>
            <a
              href={REGTECH_MOTORS.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="group mt-5 inline-flex items-center gap-3 text-sm font-semibold text-white transition-colors hover:text-cyan-300"
              aria-label="Falar com a Regtech Motors no WhatsApp"
            >
              <span className="inline-grid h-7 w-7 flex-none place-items-center rounded-full border border-blue-800 text-blue-200">
                <WhatsAppIcon className="h-4 w-4" />
              </span>
              {REGTECH_MOTORS.telephone}
              <ExternalLinkIcon className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
            <a
              href={STORE_MAP_URL}
              target="_blank"
              rel="noreferrer"
              className="group mt-4 inline-flex items-start gap-3 text-sm leading-6 text-blue-100 transition-colors hover:text-cyan-300"
              aria-label="Abrir localização da Regtech Motors no Google Maps"
            >
              <span className="mt-0.5 inline-grid h-7 w-7 flex-none place-items-center rounded-full border border-blue-800 text-blue-200">
                <MapPinIcon className="h-4 w-4" />
              </span>
              <span>
                Av. dos Estados, 216
                <br />
                Centro, Tucumã — PA
                <br />
                CEP 68385-000
              </span>
              <ExternalLinkIcon className="mt-0.5 h-4 w-4 flex-none transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
            <div className="mt-4 flex flex-col items-start gap-3">
              <a
                href="https://www.instagram.com/regtechmotors"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-cyan-300"
              >
                <span className="inline-grid h-7 w-7 place-items-center rounded-full border border-blue-800 text-blue-200">
                  <InstagramIcon className="h-4 w-4" />
                </span>
                @regtechmotors
                <ExternalLinkIcon className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <a
                href="https://www.instagram.com/regtechcellshop"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-cyan-300"
              >
                <span className="inline-grid h-7 w-7 place-items-center rounded-full border border-blue-800 text-blue-200">
                  <InstagramIcon className="h-4 w-4" />
                </span>
                @regtechcellshop
                <ExternalLinkIcon className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>

          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-blue-300">
              Horário de atendimento
            </p>
            <dl className="mt-5 grid gap-3 text-sm">
              {REGTECH_MOTORS.openingHours.map((item) => (
                <div key={item.label} className="flex items-baseline justify-between gap-4 border-b border-blue-900 pb-3 last:border-b-0 last:pb-0">
                  <dt className="text-blue-200">{item.label}</dt>
                  <dd className="font-semibold text-white">{item.hours}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-6 text-xs text-blue-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Regtech Motors. Todos os direitos reservados.</p>
          <p>
            {REGTECH_MOTORS.legalName} · CNPJ {REGTECH_MOTORS.cnpj}
          </p>
        </div>
      </div>
    </footer>
  );
}
