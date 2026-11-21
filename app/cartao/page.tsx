import type { Metadata } from "next";
import Image from "next/image";
import CardActions from "./CardActions";
import links from "./links.json";

const cardUrl = "https://regtechmotors.com.br/cartao";
const title = "Regtech | Cartão digital";
const description = "Celulares, eletrônicos e motos em Tucumã. Acesse os catálogos, fale com o atacado e encontre todos os contatos da Regtech.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: cardUrl },
  openGraph: {
    title,
    description,
    url: cardUrl,
    type: "website",
    locale: "pt_BR",
    siteName: "Regtech",
    images: [{ url: "https://regtechmotors.com.br/cartao-assets/regtech-capa.png", width: 1200, height: 630, alt: "Regtech Cell Shop e Motors: cartão digital, catálogos e atendimento" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["https://regtechmotors.com.br/cartao-assets/regtech-capa.png"],
  },
};

export default function BusinessCardPage() {
  return (
    <main className="min-h-screen bg-[#050d22] px-0 pb-10 text-white sm:px-5 sm:pt-6">
      <h1 className="sr-only">Cartão digital Regtech: celulares, eletrônicos, motos e atacado em Tucumã</h1>
      <div className="mx-auto max-w-[600px]">
        <nav aria-label="Contatos e catálogos da Regtech" className="relative overflow-hidden sm:rounded-3xl">
          <Image src="/cartao-assets/regtech-cartao.png" width={1080} height={1920} alt="" priority unoptimized className="block h-auto w-full" />
          {links.map((link) => {
            const isPix = link.url.endsWith("#pix");
            const external = !isPix && link.url.startsWith("https:");
            return (
              <a
                key={link.label}
                href={isPix ? "#pix" : link.url}
                aria-label={link.label}
                title={link.label}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="absolute min-h-11 -translate-y-1/2 rounded-xl outline-none transition-colors hover:bg-white/5 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300"
                style={{ left: `${link.x / 1080 * 100}%`, top: `${(link.y + link.h / 2) / 1920 * 100}%`, width: `${link.w / 1080 * 100}%`, height: `${link.h / 1920 * 100}%` }}
              >
                <span className="sr-only">{link.label}</span>
              </a>
            );
          })}
        </nav>
        <CardActions />
      </div>
    </main>
  );
}
