/**
 * Sessão aberta pelo link de "Esqueci minha senha" (ou convite).
 *
 * O Supabase marca no JWT como a pessoa entrou (claim "amr"). Quando foi pelo
 * link de recuperação, o painel não deve abrir direto: a pessoa precisa criar
 * a senha primeiro. Assim o link funciona mesmo se o Supabase mandar para a
 * página inicial em vez da tela de nova senha.
 */
export function isRecoverySession(claims: unknown): boolean {
  if (!claims || typeof claims !== "object") return false;
  const amr = (claims as { amr?: unknown }).amr;
  if (!Array.isArray(amr)) return false;
  return amr.some((entry) => {
    const method = typeof entry === "string" ? entry : (entry as { method?: unknown } | null)?.method;
    return method === "recovery" || method === "invite";
  });
}

/** Páginas do /admin que uma sessão de recuperação ainda pode abrir. */
export function recoveryAllowedPath(pathname: string): boolean {
  return pathname === "/admin/reset-password" || pathname === "/admin/auth/callback";
}
