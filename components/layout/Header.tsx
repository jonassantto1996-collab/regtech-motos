import Link from "next/link";

export default function Header() {
  return (
    <header className="relative z-30 border-b border-white/10 bg-blue-950 text-white">
      <div className="mx-auto flex min-h-14 max-w-7xl items-center px-4 sm:min-h-20 sm:px-6 lg:px-8">
        <nav aria-label="Navegação principal" className="flex w-full items-center justify-between gap-5 sm:w-auto sm:justify-start sm:gap-9 sm:ml-auto">
          <Link
            href="/"
            className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-blue-100 transition-colors duration-200 hover:text-cyan-300 focus-visible:outline-none focus-visible:text-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-4 focus-visible:ring-offset-blue-950 sm:text-xs sm:tracking-[0.18em]"
          >
            Início
          </Link>
          <Link
            href="/products"
            className="inline-flex min-h-11 items-center text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-white transition-colors duration-200 hover:text-cyan-300 focus-visible:outline-none focus-visible:text-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-4 focus-visible:ring-offset-blue-950 sm:min-h-0 sm:text-sm sm:tracking-[0.18em]"
          >
            Motos elétricas
          </Link>
        </nav>
      </div>
    </header>
  );
}
