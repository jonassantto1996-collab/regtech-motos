import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="relative z-30 bg-blue-950 text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:min-h-24 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-4 focus-visible:ring-offset-blue-950"
            aria-label="Regtech Motors — início"
          >
            <Image
              src="/logo-regtech-motors.png"
              alt="Regtech Motors"
              width={201}
              height={96}
              priority
              className="h-9 w-auto sm:h-12"
            />
          </Link>

          <nav aria-label="Navegação principal" className="flex items-center gap-4 sm:gap-9">
            <Link
              href="/"
              className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-blue-100 transition-colors hover:text-cyan-300 sm:inline"
            >
              Início
            </Link>
            <Link
              href="/products"
              className="inline-flex min-h-11 items-center text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:text-cyan-300 sm:min-h-0 sm:text-sm sm:tracking-[0.18em]"
            >
              Motos elétricas
            </Link>
          </nav>
        </div>
      </div>

      <div className="hidden border-b border-white/10 bg-blue-900/35 sm:block">
        <div className="mx-auto flex max-w-7xl items-center gap-7 px-6 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-blue-200 lg:px-8">
          <span>Regtech Motors</span>
          <span className="h-3 w-px bg-blue-700" aria-hidden />
          <Link href="/products" className="transition-colors hover:text-white">
            Ver modelos disponíveis
          </Link>
        </div>
      </div>
    </header>
  );
}
