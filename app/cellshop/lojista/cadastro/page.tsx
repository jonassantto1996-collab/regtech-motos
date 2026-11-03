import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ResellerSignupForm } from "@/components/cellshop/ResellerForms";
import { getCellshopBase } from "@/lib/cellshop/config";
import { getCellshopViewer } from "@/lib/cellshop/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cadastro de lojista",
  description: "Cadastre a sua loja para ver os preços de atacado da Regtech Cell Shop.",
  alternates: { canonical: "/lojista/cadastro" },
  openGraph: {
    title: "Cadastre sua loja | Regtech Cell Shop",
    description: "Lojista: faça o cadastro e, depois da aprovação, veja os preços de atacado da Regtech Cell Shop.",
    url: "/lojista/cadastro",
    siteName: "Regtech Cell Shop",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/og-cellshop-lojista.jpg", width: 1200, height: 630, alt: "Área do Lojista Regtech Cell Shop" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-cellshop-lojista.jpg"] },
};

export default async function ResellerSignupPage() {
  const [base, viewer] = await Promise.all([getCellshopBase(), getCellshopViewer()]);
  // Quem já tem cadastro vai direto para a Área do Lojista.
  if (viewer) redirect(`${base}/lojista`);

  return (
    <main className="bg-[#f6f8fb]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <Link href={`${base}/lojista`} className="inline-flex min-h-10 items-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 hover:text-[#0a6cff]">
          ← Área do Lojista
        </Link>
        <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(7,10,18,0.45)] sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0a6cff]">Atacado</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Cadastrar minha loja</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Depois da aprovação, você entra com este e-mail e senha e vê os preços de atacado no site.
          </p>
          <div className="mt-8">
            <ResellerSignupForm />
          </div>
        </div>
      </div>
    </main>
  );
}
