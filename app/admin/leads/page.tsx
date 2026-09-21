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
import { AdminShell } from "../AdminShell";
import { requireAdminSession } from "../products/actions";
import { buildLeadFollowupWhatsappLink } from "@/lib/leads/followup";
import { WhatsAppIcon } from "@/components/icons/SiteIcons";
import "../admin.css";

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
  await requireAdminSession();
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
    <AdminShell active="leads" email={claims.claims.email}>
      <section className="admin-content admin-page">
        <div className="page-heading">
          <div><span>COMERCIAL</span><h1>Leads</h1><p>Acompanhe os contatos e clique no WhatsApp para abrir uma mensagem preparada conforme o status atual.</p></div>
        </div>

        {errorMessage && <p className="admin-alert error" role="alert">{errorMessage}</p>}
        {error && <p className="admin-alert error" role="alert">Não foi possível carregar os leads.</p>}
        {!error && leads && leads.length === 0 && <div className="panel empty-state">Nenhum lead registrado ainda.</div>}

        {!error && leads && leads.length > 0 && (
          <div className="panel admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Data</th><th>Nome</th><th>WhatsApp</th><th>Produto</th><th>Preço</th><th>Status</th></tr></thead>
              <tbody>
                {(leads as Lead[]).map((lead) => (
                  <tr key={lead.id}>
                    <td>{dateFormatter.format(new Date(lead.created_at))}</td>
                    <td><strong>{lead.full_name}</strong></td>
                    <td>{(() => {
                      const href = buildLeadFollowupWhatsappLink({
                        whatsapp: lead.whatsapp,
                        fullName: lead.full_name,
                        productName: lead.product_name_snapshot,
                        status: lead.status,
                      });
                      return href ? (
                        <a
                          className="lead-whatsapp-link"
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Abrir WhatsApp de ${lead.full_name} com mensagem para status ${LEAD_STATUS_LABELS[lead.status]}`}
                          title={`Mensagem: ${LEAD_STATUS_LABELS[lead.status]}`}
                        >
                          <span className="lead-whatsapp-icon"><WhatsAppIcon /></span>
                          {formatWhatsappDisplay(lead.whatsapp)}
                        </a>
                      ) : (
                        formatWhatsappDisplay(lead.whatsapp)
                      );
                    })()}</td>
                    <td>{lead.product_name_snapshot}</td>
                    <td>{currencyFormatter.format(Number(lead.price_snapshot))}</td>
                    <td>
                      <form action={updateLeadStatus.bind(null, lead.id)} className="status-form">
                        <select name="status" defaultValue={lead.status}>
                          {LEAD_STATUSES.map((status) => <option key={status} value={status}>{LEAD_STATUS_LABELS[status]}</option>)}
                        </select>
                        <button type="submit">Salvar</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );}

