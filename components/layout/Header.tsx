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
 *
 * Navegação intencionalmente mínima: hoje só existe um destino real
 * (Catálogo), então um único link de texto — sem borda, sem "pill", sem
 * ícone de menu — é a navegação apropriada, tanto no mobile quanto no
 * desktop. Nada aqui exige um menu hambúrguer.
 */
export default function Header() {
  return (
    <header className="border-b border-white/10 bg-blue-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <Link href="/" className="shrink-0" aria-label="Regtech Motors — início">
          <Image
            src="/logo-regtech-motors.png"
            alt="Regtech Motors"
            width={201}
            height={96}
            priority
            className="h-10 w-auto sm:h-11 lg:h-12"
          />
        </Link>

        <Link
          href="/products"
          className="shrink-0 text-xs font-medium uppercase tracking-[0.2em] text-white/90 transition hover:text-cyan-300 sm:text-sm"
        >
          Catálogo
        </Link>
      </div>
    </header>
  );
}
