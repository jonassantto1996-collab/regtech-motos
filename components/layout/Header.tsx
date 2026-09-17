import Image from "next/image";
import Link from "next/link";

/**
 * Header da Home. Fundo escuro por dois motivos: (1) identidade visual
 * premium/automotiva pedida para a Home e (2) a logo oficial (public/
 * logo-regtech-motors.png) tem o texto "regtech" em contorno bem claro,
 * que só fica legível sobre um fundo escuro — em fundo claro o contorno
 * quase desaparece.
 *
 * Usado apenas em app/page.tsx (Home), não no layout raiz — para não
 * alterar a aparência do catálogo (/products) nem do /admin nesta etapa.
 */
export default function Header() {
  return (
    <header className="border-b border-white/10 bg-slate-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" aria-label="Regtech Motors — início">
          <Image
            src="/logo-regtech-motors.png"
            alt="Regtech Motors"
            width={201}
            height={96}
            priority
            className="h-9 w-auto sm:h-10 lg:h-11"
          />
        </Link>

        <Link
          href="/products"
          className="shrink-0 rounded-sm border border-white/25 px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] text-white transition hover:border-cyan-300 hover:text-cyan-300 sm:text-sm"
        >
          Catálogo
        </Link>
      </div>
    </header>
  );
}
