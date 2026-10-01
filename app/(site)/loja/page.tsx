import type { Metadata } from "next";
import Link from "next/link";
import { REGTECH_MOTORS } from "@/lib/seo/business";

export const metadata: Metadata = {
  title: "Loja de motos em Tucumã, PA | Regtech Motors",
  description:
    "Conheça a Regtech Motors em Tucumã, Pará. Loja de motos elétricas e a combustão, catálogo online e atendimento direto pelo WhatsApp.",
  alternates: { canonical: "/loja" },
  openGraph: {
    title: "Regtech Motors em Tucumã, PA",
    description:
      "Loja de motos elétricas e a combustão em Tucumã, Pará. Veja endereço, canais oficiais e catálogo.",
    type: "website",
    locale: "pt_BR",
    siteName: "Regtech Motors",
  },
};

export default function LojaPage() {
  return (
    <main className="bg-white">
      <section className="border-b border-blue-900 bg-blue-950 px-4 py-12 text-white sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
            Regtech Motors · Tucumã, PA
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            Loja de motos em Tucumã, Pará.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
            A Regtech Motors trabalha com motos elétricas e a combustão, com
            catálogo online e atendimento direto para quem procura mobilidade
            em Tucumã e região.
          </p>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
              Informações oficiais
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Regtech Motors
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600">
              Consulte os modelos disponíveis, especificações e preços no
              catálogo oficial. Para confirmar disponibilidade e atendimento,
              fale diretamente com a equipe da Regtech Motors.
            </p>

            <dl className="mt-8 divide-y divide-gray-200 border-y border-gray-200">
              <div className="grid gap-2 py-5 sm:grid-cols-[10rem_1fr]">
                <dt className="text-sm font-semibold text-gray-950">Endereço</dt>
                <dd className="text-sm leading-6 text-gray-600">
                  {REGTECH_MOTORS.streetAddress}, Centro, {REGTECH_MOTORS.addressLocality} — {REGTECH_MOTORS.addressRegion}, CEP {REGTECH_MOTORS.postalCode}
                </dd>
              </div>
              <div className="grid gap-2 py-5 sm:grid-cols-[10rem_1fr]">
                <dt className="text-sm font-semibold text-gray-950">WhatsApp</dt>
                <dd>
                  <a
                    className="text-sm font-semibold text-blue-700 underline underline-offset-4"
                    href={REGTECH_MOTORS.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {REGTECH_MOTORS.telephone}
                  </a>
                </dd>
              </div>
              <div className="grid gap-2 py-5 sm:grid-cols-[10rem_1fr]">
                <dt className="text-sm font-semibold text-gray-950">Instagram</dt>
                <dd>
                  <a
                    className="text-sm font-semibold text-blue-700 underline underline-offset-4"
                    href={REGTECH_MOTORS.instagram}
                    target="_blank"
                    rel="noreferrer"
                  >
                    @regtechmotors
                  </a>
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex min-h-12 items-center justify-center bg-blue-700 px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-blue-800"
              >
                Ver catálogo
              </Link>
              <a
                href={REGTECH_MOTORS.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center border border-gray-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-gray-900 transition-colors hover:border-gray-950"
              >
                Abrir localização
              </a>
            </div>
          </div>

          <aside className="border border-gray-200 bg-gray-50 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
              O que você encontra
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-950">
              Motos e mobilidade.
            </h2>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-gray-600">
              <li>Motos elétricas disponíveis no catálogo oficial.</li>
              <li>Modelos a combustão disponíveis no catálogo oficial.</li>
              <li>Informações de preço, cores e especificações por modelo.</li>
              <li>Atendimento comercial direto pelo WhatsApp.</li>
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
}
