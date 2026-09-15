"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Autentica um administrador por e-mail e senha (Supabase Auth).
 * Não há cadastro público — contas são criadas manualmente no painel do
 * Supabase. Erros de credencial usam uma mensagem genérica de propósito
 * (evita indicar se um e-mail existe ou não na base).
 */
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

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // TEMPORÁRIO — diagnóstico. Reverter para "invalid_credentials" depois.
    redirect(`/admin/login?error=debug&msg=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin");
}

/** Encerra a sessão do administrador autenticado. */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
