import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// No Next.js 16, "proxy.ts" substitui o antigo "middleware.ts" (mesma função,
// nome renomeado). Roda em toda requisição que casar com o matcher abaixo.
export async function proxy(request: NextRequest) {
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
