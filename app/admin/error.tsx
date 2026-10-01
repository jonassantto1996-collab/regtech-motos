"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f4f7fb", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <section style={{ width: "min(520px,100%)", background: "#fff", border: "1px solid #dfe6ee", borderRadius: 12, padding: 28, boxShadow: "0 10px 30px #10243a12" }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".18em", color: "#087cff" }}>PAINEL ADMINISTRATIVO</span>
        <h1 style={{ margin: "8px 0", fontSize: 25, color: "#172436" }}>Ocorreu um erro no Admin.</h1>
        <p style={{ margin: "0 0 20px", fontSize: 12, lineHeight: 1.6, color: "#687789" }}>A operação não pôde ser concluída. Tente carregar novamente.</p>
        <button type="button" onClick={() => reset()} style={{ minHeight: 42, border: 0, borderRadius: 7, padding: "0 16px", background: "#075ad7", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Tentar novamente</button>
      </section>
    </main>
  );
}
