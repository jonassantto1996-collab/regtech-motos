import Link from "next/link";
import { getCellshopBase } from "@/lib/cellshop/config";

/** Página que não existe na loja (link antigo, digitado errado): leva de volta para a vitrine. */
export default async function CellshopNotFound() {
  const base = await getCellshopBase();
  return (
    <main className="bg-[#070a12] text-white">
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#22d3ee]">Regtech Cell Shop</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Esta página não existe mais</h1>
        <p className="mx-auto mt-4 max-w-xl text-[0.9375rem] leading-6 text-slate-300">
          O produto pode ter saído da loja ou o link mudou. Veja o que temos hoje na vitrine ou fale com a loja pelo WhatsApp.
        </p>
        <Link
          href={`${base || "/"}#vitrine`}
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#00c8ff] to-[#0a5cff] px-7 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:brightness-110"
        >
          Ver produtos
        </Link>
      </div>
    </main>
  );
}
