import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Atualiza a sessão do Supabase a cada requisição e protege a área /admin.
 *
 * A autenticação NUNCA é decidida por informação vinda do cliente: getClaims()
 * valida o JWT (assinatura + expiração) antes de considerar alguém autenticado.
 * Nunca usar getSession() aqui — ela não revalida o token.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Com Fluid Compute, o client não pode viver em variável global — precisa
  // ser criado a cada requisição.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          );
        },
      },
    }
  );

  // Não executar nenhum código entre createServerClient e getClaims():
  // um erro aqui pode deslogar usuários aleatoriamente de forma difícil de
  // depurar.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);

  const { pathname } = request.nextUrl;
  const isAdminArea = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";

  if (isAdminArea && !isLoginPage && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // Retornar sempre este objeto (com os cookies já copiados acima) — criar
  // uma nova resposta do zero aqui quebraria a sincronia entre navegador e
  // servidor.
  return supabaseResponse;
}
