import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-blue-950 px-4 py-20 text-white">
      <div className="mx-auto max-w-2xl border border-white/15 bg-white/5 p-8 sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Regtech Motors</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Página não encontrada.</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-blue-100">
          O endereço acessado não existe ou não está mais disponível.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link className="inline-flex min-h-12 items-center justify-center bg-white px-6 text-sm font-semibold text-blue-950" href="/">Voltar para o início</Link>
          <Link className="inline-flex min-h-12 items-center justify-center border border-white/30 px-6 text-sm font-semibold text-white" href="/products">Ver motos</Link>
        </div>
      </div>
    </main>
  );
}
