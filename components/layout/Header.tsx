import Link from "next/link";
import BrandLogo from "@/components/layout/BrandLogo";

const NAV_LINK =
  "inline-flex min-h-11 items-center text-[0.6875rem] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 hover:text-cyan-300 focus-visible:outline-none focus-visible:text-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-4 focus-visible:ring-offset-blue-950 sm:min-h-0 sm:text-xs sm:tracking-[0.18em]";

export default function Header() {
  return (
    <header className="relative z-30 border-b border-white/10 bg-blue-950 text-white">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:min-h-20 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Regtech Motors — início"
          className="inline-flex flex-none items-center outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-4 focus-visible:ring-offset-blue-950"
        >
          <BrandLogo priority className="h-8 sm:h-10" />
        </Link>

        <nav
          aria-label="Navegação principal"
          className="flex items-center gap-6 sm:gap-9"
        >
          <Link href="/" className={`${NAV_LINK} text-blue-100`}>
            Início
          </Link>
          <Link href="/products" className={`${NAV_LINK} text-white sm:text-sm`}>
            Motos
          </Link>
        </nav>
      </div>
    </header>
  );
}
