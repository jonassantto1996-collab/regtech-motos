import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logout } from "./actions";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/leads/types";

// Verificação em segundo nível (defesa em profundidade): o proxy já
// redireciona quem não está autenticado antes de chegar aqui, mas a página
// também valida a sessão no servidor de forma independente.
export default async function AdminPage() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/admin/login");
  }

  // Resumo de leads por status (Seção 11 da Etapa 4.6). Usa service_role
  // porque a RLS pública não libera SELECT em leads nem para authenticated.
  const admin = createAdminClient();
  const { data: leadStatuses } = await admin.from("leads").select("status");

  const statusCounts: Record<LeadStatus, number> = {
    NOVO: 0,
    EM_ATENDIMENTO: 0,
    INTERESSADO: 0,
    VENDA_REALIZADA: 0,
    NAO_CONVERTIDO: 0,
  };
  if (leadStatuses) {
    for (const row of leadStatuses as { status: LeadStatus }[]) {
      statusCounts[row.status] += 1;
    }
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
      <p>
        <Link href="/admin/hero">Hero da Home &rarr;</Link>
      </p>

      <h2 style={{ marginTop: "2rem", fontSize: "1rem" }}>Leads por status</h2>
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginTop: "0.75rem",
        }}
      >
        {LEAD_STATUSES.map((status) => (
          <div
            key={status}
            style={{
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: "0.5rem 0.75rem",
              minWidth: 100,
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "#666" }}>
              {LEAD_STATUS_LABELS[status]}
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>
              {statusCounts[status]}
            </div>
          </div>
        ))}
      </div>

      <form action={logout} style={{ marginTop: "2rem" }}>
        <button type="submit" style={{ padding: "0.5rem 1.5rem" }}>
          Sair
        </button>
      </form>
    </main>
  );
}
