import { login } from "../actions";

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
    <main
      style={{
        maxWidth: 360,
        margin: "4rem auto",
        padding: "0 1rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1>Regtech Motors</h1>
      <form action={login}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="email">E-mail</label>
          <br />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="password">Senha</label>
          <br />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        {errorMessage && (
          <p role="alert" style={{ color: "#c0392b" }}>
            {errorMessage}
          </p>
        )}
        <button type="submit" style={{ padding: "0.5rem 1.5rem" }}>
          Entrar
        </button>
      </form>
    </main>
  );
}
