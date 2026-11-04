"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorizedAdmin } from "@/lib/admin/authorization";
import { resolveAuthBaseUrl } from "@/lib/admin/auth-url";
import { OFFICIAL_SITE_URL } from "@/lib/site-url";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hashRateLimitKey, isRateLimitAllowed } from "@/lib/leads/rate-limit";

/**
 * Autentica um administrador por e-mail e senha (Supabase Auth).
 * Não há cadastro público — contas são criadas manualmente no painel do
 * Supabase. Erros de credencial usam uma mensagem genérica de propósito
 * (evita indicar se um e-mail existe ou não na base).
 * Contra tentativa de adivinhar senha: no máximo 10 tentativas por endereço
 * de internet e 5 por e-mail a cada 15 minutos.
 */
async function loginAllowed(key: string, max: number) {
  const { data, error } = await createAdminClient().rpc("consume_lead_rate_limit", {
    p_key_hash: hashRateLimitKey(`admin-login:${key}`, process.env.SUPABASE_SERVICE_ROLE_KEY),
    p_window_seconds: 900,
    p_max_requests: max,
  });
  if (error) console.error("[admin] limite de tentativas:", error.message);
  return isRateLimitAllowed(data, error);
}

export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email ||
    !password
  ) {
    redirect("/admin/login?error=missing_fields");
  }

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await loginAllowed(`ip:${ip}`, 10)) || !(await loginAllowed(`email:${email.trim().toLowerCase()}`, 5))) {
    redirect("/admin/login?error=rate_limited");
  }

  const supabase = await createClient();

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !signInData.user) {
    redirect("/admin/login?error=invalid_credentials");
  }

  const admin = createAdminClient();
  const { data: adminUser, error: adminError } = await admin
    .from("admin_users")
    .select("role,is_active")
    .eq("user_id", signInData.user.id)
    .maybeSingle();

  if (!isAuthorizedAdmin(adminUser, adminError)) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not_authorized");
  }

  redirect("/admin");
}

/** Encerra a sessão do administrador autenticado. */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/** Envia um link de recuperação sem revelar se o e-mail está cadastrado. */
export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email");
  if (typeof email !== "string" || !email.trim()) {
    redirect("/admin/forgot-password?error=missing_email");
  }

  const normalizedEmail = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    redirect("/admin/forgot-password?error=invalid_email");
  }

  const supabase = await createClient();
  const siteUrl = resolveAuthBaseUrl({
    configuredUrl: OFFICIAL_SITE_URL,
    vercelUrl: process.env.VERCEL_URL,
    vercelEnv: process.env.VERCEL_ENV,
  });
  const redirectTo = siteUrl
    ? `${siteUrl}/admin/auth/callback?next=/admin/reset-password`
    : undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    ...(redirectTo ? { redirectTo } : {}),
  });

  if (error) {
    const isRateLimit =
      error.status === 429 ||
      ("code" in error && error.code === "over_email_send_rate_limit");

    redirect(
      `/admin/forgot-password?error=${isRateLimit ? "rate_limited" : "send_failed"}`
    );
  }

  redirect("/admin/forgot-password?sent=1");
}

/** Atualiza a senha de uma sessão autenticada pelo link de recuperação. */
export async function updatePassword(formData: FormData) {
  const password = formData.get("password");
  const confirmation = formData.get("password_confirmation");

  if (typeof password !== "string" || typeof confirmation !== "string") {
    redirect("/admin/reset-password?error=missing_fields");
  }
  if (password.length < 10) {
    redirect("/admin/reset-password?error=weak_password");
  }
  if (password !== confirmation) {
    redirect("/admin/reset-password?error=password_mismatch");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/admin/reset-password?error=invalid_session");
  }

  await supabase.auth.signOut();
  redirect("/admin/login?reset=success");
}
