import type { Metadata } from "next";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/icons/SiteIcons";
import { ResellerLoginForm } from "@/components/cellshop/ResellerForms";
import { CELLSHOP, getCellshopBase } from "@/lib/cellshop/config";
import { getCellshopViewer } from "@/lib/cellshop/queries";
import { safeResellerNext } from "@/lib/store/resellers";
import { logoutReseller } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // Página só para quem recebeu o link no grupo de lojistas: fora do Google.
  robots: { index: false, follow: false },
  title: "Área do Lojista",
  description: "Lojistas cadastrados e aprovados veem os preços de atacado da Regtech Cell Shop.",
  alternates: { canonical: "/lojista" },
  openGraph: {
    title: "Área do Lojista | Regtech Cell Shop",
    description: "Cadastre sua loja e compre no atacado. Preços exclusivos para lojistas aprovados.",
    url: "/lojista",
    siteName: "Regtech Cell Shop",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/og-cellshop-lojista.png", width: 1200, height: 630, alt: "Área do Lojista Regtech Cell Shop" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-cellshop-lojista.png"] },
};

type SearchParams = Promise<{ novo?: string; produto?: string }>;

const CARD = "rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(7,10,18,0.45)] sm:p-9";

function whatsappLink(text: string) {
  // Assuntos de lojista vão para o atendimento do atacado.
  return `${CELLSHOP.wholesaleWhatsapp}?text=${encodeURIComponent(text)}`;
}

export default async function ResellerAreaPage({ searchParams }: { searchParams: SearchParams }) {
  const [{ novo, produto }, base, viewer] = await Promise.all([searchParams, getCellshopBase(), getCellshopViewer()]);
  const home = base || "/";
  // Link de um produto exclusivo para lojistas: depois de entrar, volta para ele.
  const next = safeResellerNext(produto ? `/produto/${produto}` : null) ?? undefined;

  return (
    <main className="bg-[#f6f8fb]">
      <section className="bg-[#070a12] text-white">
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#22d3ee]">Regtech Cell Shop · Atacado</p>
          <h1 className="mt-4 max-w-3xl text-[2.125rem] font-bold leading-[1.05] tracking-tight sm:text-5xl">Área do Lojista</h1>
          <p className="mt-5 max-w-2xl text-[0.9375rem] leading-6 text-slate-300 sm:text-lg sm:leading-7">
            Para lojas que revendem: depois que o cadastro é aprovado, o site mostra os preços de atacado em todos os produtos.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {!viewer && next && (
          <p role="status" className="mb-8 rounded-2xl border border-[#0a6cff]/25 bg-[#0a6cff]/[0.06] px-5 py-4 text-sm leading-6 text-slate-800 sm:text-base">
            <strong className="text-slate-950">Este produto é exclusivo para lojistas.</strong> Entre com o seu e-mail e senha para ver o produto e o preço de atacado.
          </p>
        )}

        {!viewer && (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            <div className="order-2 lg:order-1">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Compre no atacado com a Regtech</h2>
              <ol className="mt-8 grid gap-6">
                {[
                  ["Cadastre a sua loja", "Nome da loja, CNPJ (ou CPF), cidade e WhatsApp. Leva um minuto."],
                  ["A Regtech aprova", "A equipe confere os dados e libera o seu acesso."],
                  ["Veja os preços de atacado", "Entre com o seu e-mail e senha: o site inteiro passa a mostrar o atacado."],
                ].map(([title, text], i) => (
                  <li key={title} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#070a12] text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                href={`${base}/lojista/cadastro`}
                className="mt-9 inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition-colors hover:border-[#0a6cff] hover:text-[#0a5cff]"
              >
                Cadastrar minha loja
              </Link>
            </div>

            <div className={`order-1 lg:order-2 ${CARD}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0a6cff]">Já tenho cadastro</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">Entrar</h2>
              <div className="mt-6">
                <ResellerLoginForm
                  next={next}
                  footer={
                    <div className="space-y-2 pt-1 text-center text-sm text-slate-600">
                      <p>
                        Ainda não tem cadastro?{" "}
                        <Link href={`${base}/lojista/cadastro`} className="font-semibold text-[#0a5cff] hover:underline">
                          Cadastrar minha loja
                        </Link>
                      </p>
                      <p>
                        Esqueceu a senha?{" "}
                        <a href={whatsappLink("Olá! Sou lojista e esqueci a senha da Área do Lojista.")} target="_blank" rel="noreferrer" className="font-semibold text-[#0a5cff] hover:underline">
                          Fale com a loja
                        </a>
                      </p>
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        )}

        {viewer && (
          <div className={`mx-auto max-w-2xl ${CARD}`}>
            {viewer.status === "approved" && (
              <>
                <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-emerald-500" /> Acesso liberado
                </p>
                <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Olá, {viewer.contact_name.split(" ")[0]}!</h2>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  Você está vendo os <strong className="text-slate-950">preços de atacado</strong> da Regtech Cell Shop como{" "}
                  <strong className="text-slate-950">{viewer.store_name}</strong>. O pedido sai pelo WhatsApp, já identificado como lojista.
                </p>
                <Link
                  href={`${home}#vitrine`}
                  className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#00c8ff] to-[#0a5cff] px-6 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:brightness-110 sm:w-auto"
                >
                  Ver produtos no atacado
                </Link>
              </>
            )}

            {viewer.status === "pending" && (
              <>
                <p className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-amber-700">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-amber-500" /> Em análise
                </p>
                <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                  {novo ? "Cadastro recebido!" : "Seu cadastro está em análise"}
                </h2>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  A Regtech vai conferir os dados da <strong className="text-slate-950">{viewer.store_name}</strong> e liberar o seu acesso.
                  Enquanto isso, o site mostra os preços de varejo.
                </p>
                <a
                  href={whatsappLink(`Olá! Fiz o cadastro de lojista da ${viewer.store_name} no site e queria agilizar a liberação.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#15803d] px-6 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:brightness-110 sm:w-auto"
                >
                  <WhatsAppIcon className="h-5 w-5" /> Avisar a loja no WhatsApp
                </a>
              </>
            )}

            {(viewer.status === "rejected" || viewer.status === "blocked") && (
              <>
                <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-slate-400" /> Acesso não liberado
                </p>
                <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Acesso de lojista não liberado</h2>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  O cadastro da <strong className="text-slate-950">{viewer.store_name}</strong> não está liberado para os preços de atacado. Fale com a
                  loja para saber mais.
                </p>
                <a
                  href={whatsappLink(`Olá! Sou da ${viewer.store_name} e queria falar sobre o meu cadastro de lojista.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#15803d] px-6 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:brightness-110 sm:w-auto"
                >
                  <WhatsAppIcon className="h-5 w-5" /> Falar com a loja
                </a>
              </>
            )}

            <form action={logoutReseller} className="mt-6 border-t border-slate-200 pt-5">
              <button type="submit" className="min-h-11 text-sm font-semibold text-slate-600 hover:text-slate-950">
                Sair da conta
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
