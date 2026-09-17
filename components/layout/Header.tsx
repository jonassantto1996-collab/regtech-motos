import Image from "next/image";
import Link from "next/link";

/**
 * Header público — usado em toda a experiência pública (Home, catálogo,
 * detalhe de produto) via app/(site)/layout.tsx. Não aparece em /admin.
 *
 * Fundo azul escuro (não preto/slate) por dois motivos: (1) a logo
 * oficial (public/logo-regtech-motors.png) tem o texto "regtech" em
 * contorno bem claro, que só fica legível sobre um fundo escuro — em
 * fundo branco o contorno quase desaparece; (2) o azul precisa continuar
 * reconhecível como o azul da marca, não virar um azul-marinho/preto
 * genérico.
 */
export default function Header() {
  return (
    <header className="border-b border-white/10 bg-blue-950">
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
