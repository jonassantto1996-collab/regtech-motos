"use client";

import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/icons/SiteIcons";
import { REGTECH_MOTORS } from "@/lib/seo/business";

const MESSAGE = "Olá! Vim pelo site da Regtech Motors e quero mais informações.";
const HREF = `${REGTECH_MOTORS.whatsapp}?text=${encodeURIComponent(MESSAGE)}`;

/**
 * Botão flutuante do WhatsApp (Regtech Motors).
 * Fica escondido no detalhe da moto (/products/[slug]), onde o cliente usa o
 * "Tenho interesse" — assim o lead continua sendo registrado no painel.
 */
export default function FloatingWhatsApp() {
  const pathname = usePathname();
  if (pathname.startsWith("/products/")) return null;

  return (
    <a
      href={HREF}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar com a Regtech Motors no WhatsApp"
      className="group fixed right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-transform duration-200 hover:-translate-y-0.5 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 sm:right-6 sm:h-16 sm:w-16"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <WhatsAppIcon className="h-7 w-7 sm:h-8 sm:w-8" />
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full bg-gray-950 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 sm:block">
        Fale no WhatsApp
      </span>
    </a>
  );
}
