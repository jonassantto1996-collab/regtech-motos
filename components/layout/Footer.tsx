import Image from "next/image";
import Link from "next/link";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { ExternalLinkIcon, MapPinIcon } from "@/components/icons/SiteIcons";

const STORE_MAP_URL = "https://www.google.com/maps/search/?api=1&query=Av.%20dos%20Estados%2C%20241%2C%20Centro%2C%20Tucum%C3%A3%2C%20PA%2C%2068385-000";

export default function Footer() {
  return (
    <footer className="border-t border-blue-900 bg-blue-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="grid gap-10 border-b border-blue-900 pb-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.7fr_0.9fr] lg:gap-16 lg:pb-12">
          <div>
            <Link
              href="/"
              className="inline-block outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              aria-label="Regtech Motors — início"
            >
              <Image
                src="/logo-regtech-motors.png"
                alt="Regtech Motors"
                width={201}
                height={96}
                className="h-9 w-auto sm:h-10"
              />
            </Link>
            <p className="mt-5 max-w-md text-sm leading-6 text-blue-200">
              Conheça a linha Regtech Motors e fale com nossa equipe para saber
              mais sobre os modelos disponíveis.
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
                Motos elétricas
              </Link>
            </nav>
          </div>

          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-blue-300">
              Canais oficiais
            </p>
            <a
              href={STORE_MAP_URL}
              target="_blank"
              rel="noreferrer"
              className="group mt-5 inline-flex items-start gap-3 text-sm leading-6 text-blue-100 transition-colors hover:text-cyan-300"
              aria-label="Abrir localização da Regtech CellShop no Google Maps"
            >
              <span className="mt-0.5 inline-grid h-7 w-7 flex-none place-items-center rounded-full border border-blue-800 text-blue-200">
                <MapPinIcon className="h-4 w-4" />
              </span>
              <span>
                Av. dos Estados, 241
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
        </div>

      </div>
    </footer>
  );
}
