import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logout } from "./actions";

// Verificação em segundo nível (defesa em profundidade): o proxy já
// redireciona quem não está autenticado antes de chegar aqui, mas a página
// também valida a sessão no servidor de forma independente.
export default async function AdminPage() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/admin/login");
  }

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "4rem auto",
        padding: "0 1rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1>Área administrativa</h1>
      <p>Autenticado como: {data.claims.email ?? "—"}</p>
      <p>
        <Link href="/admin/products">Produtos &rarr;</Link>
      </p>
      <p>
        <Link href="/admin/leads">Leads &rarr;</Link>
      </p>
      <form action={logout}>
        <button type="submit" style={{ padding: "0.5rem 1.5rem" }}>
          Sair
        </button>
      </form>
    </main>
  );
}
