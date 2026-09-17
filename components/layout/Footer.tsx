import Image from "next/image";
import Link from "next/link";

/**
 * Footer da Home. Inclui apenas links para rotas que realmente existem
 * hoje (Catálogo). Não inclui Contato / Política de Privacidade / Termos
 * porque essas rotas ainda não existem no site — ver relatório da tarefa.
 *
 * Usado apenas em app/page.tsx (Home), pelo mesmo motivo do Header.
 */
export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <Image
          src="/logo-regtech-motors.png"
          alt="Regtech Motors"
          width={201}
          height={96}
          className="h-7 w-auto opacity-90"
        />

        <Link
          href="/products"
          className="text-sm font-medium uppercase tracking-[0.15em] text-slate-300 transition hover:text-cyan-300"
        >
          Catálogo
        </Link>
      </div>
    </footer>
  );
}
