import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Regtech Motos</h1>
      <p>Estrutura inicial do projeto. Leads ainda não desenvolvidos.</p>
      <p style={{ marginTop: "1rem" }}>
        <Link href="/products" style={{ textDecoration: "underline" }}>
          Ver catálogo de motos
        </Link>
      </p>
    </main>
  );
}
