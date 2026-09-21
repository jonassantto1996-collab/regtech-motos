"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen bg-blue-950 px-4 py-20 text-white">
      <div className="mx-auto max-w-2xl border border-white/15 bg-white/5 p-8 sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Regtech Motors</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Não foi possível carregar esta página.</h1>
        <p className="mt-4 text-sm leading-6 text-blue-100">Tente novamente. Se o problema continuar, volte ao início e repita a operação.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button className="min-h-12 bg-white px-6 text-sm font-semibold text-blue-950" type="button" onClick={() => reset()}>Tentar novamente</button>
          <a className="inline-flex min-h-12 items-center justify-center border border-white/30 px-6 text-sm font-semibold text-white" href="/">Voltar ao início</a>
        </div>
      </div>
    </main>
  );
}
