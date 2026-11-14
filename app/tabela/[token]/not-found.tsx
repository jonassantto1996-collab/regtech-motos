/** Link da tabela errado ou trocado no painel: avisa o vendedor para pedir o novo. */
export default function PriceTableNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070a12] px-6 text-center text-white">
      <div className="max-w-sm">
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#22d3ee]">Regtech Cell Shop · Atacado</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Este link da tabela mudou</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          O endereço não está mais valendo. Peça o link novo para a loja e salve de novo na tela inicial do celular.
        </p>
      </div>
    </main>
  );
}
