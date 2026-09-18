import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-blue-900 bg-blue-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-10 border-b border-blue-900 pb-10 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <Link
              href="/"
              className="inline-block outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              aria-label="Regtech Motors — início"
            >
              <Image
                src="/logo-regtech-motors.png"
                alt="Regtech Motors"
                width={201}
                height={96}
                className="h-9 w-auto sm:h-10"
              />
            </Link>
            <p className="mt-5 max-w-md text-sm leading-6 text-blue-200">
              Conheça a linha Regtech Motors e fale com nossa equipe para
              saber mais sobre os modelos disponíveis.
            </p>
          </div>

          <nav aria-label="Navegação do rodapé" className="flex gap-7">
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100 transition-colors hover:text-cyan-300"
            >
              Início
            </Link>
            <Link
              href="/products"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100 transition-colors hover:text-cyan-300"
            >
              Catálogo
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-2 pt-6 text-xs text-blue-300 sm:flex-row sm:items-center sm:justify-between">
          <p>Regtech Motors</p>
          <p>Mobilidade elétrica</p>
        </div>
      </div>
    </footer>
  );
}
