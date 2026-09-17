import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateLeadStatus } from "./actions";
import { LEAD_ERROR_MESSAGES } from "./types";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type Lead,
} from "@/lib/leads/types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

/** Só formatação de exibição — não altera o valor salvo (dígitos puros). */
function formatWhatsappDisplay(digits: string): string {
  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 12) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const errorMessage = params.error ? LEAD_ERROR_MESSAGES[params.error] : null;

  const admin = createAdminClient();
  const { data: leads, error } = await admin
    .from("leads")
    .select(
      "id, full_name, whatsapp, product_name_snapshot, price_snapshot, status, created_at"
    )
    .order("created_at", { ascending: false });

  return (
    <main
      style={{
        maxWidth: 960,
        margin: "3rem auto",
        padding: "0 1rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1>Leads</h1>

      <p>
        <Link href="/admin">&larr; Voltar para área administrativa</Link>
      </p>

      {errorMessage && (
        <p role="alert" style={{ color: "#c0392b" }}>
          {errorMessage}
        </p>
      )}

      {error && (
        <p role="alert" style={{ color: "#c0392b" }}>
          Não foi possível carregar os leads.
        </p>
      )}

      {!error && leads && leads.length === 0 && (
        <p>Nenhum lead registrado ainda.</p>
      )}

      {!error && leads && leads.length > 0 && (
        <div style={{ overflowX: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}
        >
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
              <th style={thStyle}>Data</th>
              <th style={thStyle}>Nome</th>
              <th style={thStyle}>WhatsApp</th>
              <th style={thStyle}>Produto</th>
              <th style={thStyle}>Preço</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {(leads as Lead[]).map((lead) => (
              <tr key={lead.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={tdStyle}>
                  {dateFormatter.format(new Date(lead.created_at))}
                </td>
                <td style={tdStyle}>{lead.full_name}</td>
                <td style={tdStyle}>
                  {formatWhatsappDisplay(lead.whatsapp)}
                </td>
                <td style={tdStyle}>{lead.product_name_snapshot}</td>
                <td style={tdStyle}>
                  {currencyFormatter.format(Number(lead.price_snapshot))}
                </td>
                <td style={tdStyle}>
                  <form
                    action={updateLeadStatus.bind(null, lead.id)}
                    style={{ display: "flex", gap: "0.5rem" }}
                  >
                    <select
                      name="status"
                      defaultValue={lead.status}
                      style={{ padding: "0.25rem" }}
                    >
                      {LEAD_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {LEAD_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                    <button type="submit" style={{ padding: "0.25rem 0.75rem" }}>
                      Salvar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </main>
  );
}

const thStyle = { padding: "0.5rem" };
const tdStyle = { padding: "0.5rem" };
