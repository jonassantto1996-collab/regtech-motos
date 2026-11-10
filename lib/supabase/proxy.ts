import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isRecoverySession, recoveryAllowedPath } from "@/lib/admin/recovery-session";

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
  const isAuthCallback = pathname === "/admin/auth/callback";
  const isPublicAuthPage = isLoginPage || pathname === "/admin/forgot-password" || pathname === "/admin/reset-password" || isAuthCallback;

  if (isAdminArea && !isPublicAuthPage && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // Entrou pelo link de recuperação de senha: só libera o painel depois de
  // criar a senha nova (o updatePassword encerra essa sessão). Só GET, para
  // não quebrar envios de formulário (server actions).
  if (
    isAdminArea &&
    isAuthenticated &&
    request.method === "GET" &&
    !recoveryAllowedPath(pathname) &&
    isRecoverySession(data?.claims)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/reset-password";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  // Simetria com a regra acima: um admin já autenticado não precisa ver o
  // formulário de login de novo — evita a pequena inconsistência de
  // navegação de ficar "preso" na tela de login mesmo já logado.
  if ((isLoginPage || pathname === "/admin/forgot-password") && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  if (isAdminArea) {
    supabaseResponse.headers.set("Cache-Control", "private, no-store");
  }

  // Retornar sempre este objeto (com os cookies já copiados acima) — criar
  // uma nova resposta do zero aqui quebraria a sincronia entre navegador e
  // servidor.
  return supabaseResponse;
}

/**
 * Renova a sessão (cookies do Supabase) mantendo a resposta já montada, ex.:
 * o "rewrite" do domínio da Cell Shop. Sem cookie de sessão, não faz nada.
 * Usado pela Área do Lojista para o login não cair depois de 1 hora.
 */
export async function refreshSessionInto(request: NextRequest, response: NextResponse): Promise<NextResponse> {
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (!hasSession) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    }
  );
  await supabase.auth.getClaims();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
