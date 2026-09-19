import Link from "next/link";
import { requestPasswordReset } from "../actions";
import "../admin.css";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const params = await searchParams;
  return (
    <main className="auth-simple-page">
      <section className="auth-simple-card">
        <div className="login-logo dark">REGTECH <span>MOTORS</span></div>
        <span className="login-kicker">RECUPERAÇÃO DE ACESSO</span>
        <h1>Esqueceu sua senha?</h1>
        {params.sent === "1" ? (
          <div className="auth-feedback">
            <strong>Verifique seu e-mail.</strong>
            <p>Se existir uma conta administrativa para o endereço informado, você receberá as instruções para redefinir sua senha.</p>
            <Link href="/admin/login">Voltar para o login</Link>
          </div>
        ) : (
          <>
            <p>Informe o e-mail da sua conta administrativa. Enviaremos as instruções de recuperação.</p>
            <form action={requestPasswordReset}>
              <label htmlFor="email">E-mail</label>
              <input id="email" name="email" type="email" autoComplete="email" required />
              {params.error && <p className="login-error" role="alert">Informe um e-mail válido.</p>}
              <button type="submit">Enviar instruções</button>
            </form>
            <Link className="auth-back" href="/admin/login">← Voltar para o login</Link>
          </>
        )}
      </section>
    </main>
  );
}
