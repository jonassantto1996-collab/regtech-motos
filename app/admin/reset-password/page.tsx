import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePassword } from "../actions";
import { PasswordField } from "../login/PasswordField";
import "../admin.css";

const messages: Record<string, string> = {
  missing_fields: "Preencha os dois campos.",
  weak_password: "A nova senha deve ter pelo menos 10 caracteres.",
  password_mismatch: "As senhas informadas não são iguais.",
  invalid_session: "Este link expirou ou não é mais válido. Solicite uma nova recuperação.",
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/forgot-password?error=invalid_link");

  const params = await searchParams;
  return (
    <main className="auth-simple-page">
      <section className="auth-simple-card">
        <div className="login-logo dark">REGTECH <span>MOTORS</span></div>
        <span className="login-kicker">NOVA SENHA</span>
        <h1>Redefinir senha</h1>
        <p>Crie uma nova senha para sua conta administrativa.</p>
        <form action={updatePassword}>
          <PasswordField id="password" name="password" autoComplete="new-password" label="Nova senha" />
          <PasswordField id="password_confirmation" name="password_confirmation" autoComplete="new-password" label="Confirmar nova senha" />
          {params.error && <p className="login-error" role="alert">{messages[params.error] ?? "Não foi possível atualizar a senha."}</p>}
          <button type="submit">Salvar nova senha</button>
        </form>
        <Link className="auth-back" href="/admin/login">← Voltar para o login</Link>
      </section>
    </main>
  );
}
