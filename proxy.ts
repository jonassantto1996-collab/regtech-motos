import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// No Next.js 16, "proxy.ts" substitui o antigo "middleware.ts" (mesma função,
// nome renomeado). Roda em toda requisição que casar com o matcher abaixo.

// Domínio da Regtech Cell Shop (loja de tecnologia). As páginas ficam em
// app/cellshop; neste domínio elas aparecem na raiz (/, /produto/...).
const CELLSHOP_DOMAIN = "regtechcellshop.com.br";
const MOTORS_URL = "https://regtechmotors.com.br";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase().split(":")[0] ?? "";

  if (host === `www.${CELLSHOP_DOMAIN}`) {
    const url = request.nextUrl.clone();
    url.host = CELLSHOP_DOMAIN;
    url.port = "";
    url.protocol = "https";
    return NextResponse.redirect(url, 308);
  }

  if (host === CELLSHOP_DOMAIN) {
    const { pathname, search } = request.nextUrl;
    // O painel continua no endereço da Regtech Motors.
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(`${MOTORS_URL}${pathname}${search}`, 308);
    }
    // Rotas técnicas (contagem de visitas etc.) seguem iguais.
    if (pathname.startsWith("/api")) return NextResponse.next();
    // robots.txt, sitemap.xml e a chave do IndexNow (.txt) respondem pelo domínio
    // (app/robots.ts e app/sitemap.ts já entregam a versão da Cell Shop).
    if (pathname === "/robots.txt" || pathname === "/sitemap.xml" || pathname.endsWith(".txt")) {
      return NextResponse.next();
    }
    // Evita endereço duplicado: /cellshop/x vira /x neste domínio.
    if (pathname === "/cellshop" || pathname.startsWith("/cellshop/")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.slice("/cellshop".length) || "/";
      return NextResponse.redirect(url, 308);
    }
    const url = request.nextUrl.clone();
    url.pathname = `/cellshop${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas, exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico
     * - arquivos de imagem comuns
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
