import type { ReactNode } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

/**
 * Layout do grupo (site) — aplica o Header e o Footer públicos a todas as
 * páginas da experiência pública: Home (/), catálogo (/products) e
 * detalhe de produto (/products/[slug]).
 *
 * É um route group ("(site)"), então não aparece na URL: /products
 * continua sendo /products. O propósito de isolar essas rotas num grupo
 * é justamente para NÃO afetar /admin, que continua fora do grupo e
 * renderiza direto a partir do layout raiz (app/layout.tsx), sem o
 * cabeçalho/rodapé públicos.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
