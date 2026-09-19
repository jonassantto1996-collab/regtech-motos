import { login } from "../actions";
import "../admin.css";

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Preencha e-mail e senha.",
  invalid_credentials: "E-mail ou senha inválidos.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : null;

  return (
    <main className="admin-login">
      <section className="login-brand">
        <div className="login-logo">REGTECH <span>MOTORS</span></div>
        <div>
          <span className="login-kicker">PAINEL ADMINISTRATIVO</span>
          <h1>Gestão do catálogo<br />Regtech Motors.</h1>
          <p>Acesso reservado para administração de produtos, leads e conteúdo da Home.</p>
        </div>
        <small>Regtech Motors</small>
      </section>

      <section className="login-form-area">
        <div className="login-card">
          <span className="login-kicker">ACESSO SEGURO</span>
          <h2>Entrar no Admin</h2>
          <p>Use suas credenciais administrativas.</p>
          <form action={login}>
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
            <label htmlFor="password">Senha</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
            {errorMessage && <p className="login-error" role="alert">{errorMessage}</p>}
            <button type="submit">Entrar</button>
          </form>
        </div>
      </section>
    </main>
  );
}
