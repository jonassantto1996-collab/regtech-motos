import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/leads/types";
import { AdminShell } from "./AdminShell";
import {PackageIcon,CheckCircleIcon,AlertCircleIcon,UsersIcon,UserIcon} from "./icons";
import { requireAdminSession } from "./products/actions";
import "./admin.css";

const dayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });

export default async function AdminPage() {
  await requireAdminSession();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/login");

  const admin = createAdminClient();
  const [{ data: leadRows }, { data: products }, { data: recentLeads }] = await Promise.all([
    admin.from("leads").select("status,created_at"),
    admin.from("products").select("id,is_active,availability"),
    admin.from("leads").select("id,full_name,status,created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const statusCounts: Record<LeadStatus, number> = {
    NOVO: 0,
    EM_ATENDIMENTO: 0,
    INTERESSADO: 0,
    VENDA_REALIZADA: 0,
    NAO_CONVERTIDO: 0,
  };

  for (const row of (leadRows ?? []) as { status: LeadStatus; created_at: string }[]) {
    if (statusCounts[row.status] !== undefined) statusCounts[row.status] += 1;
  }

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const count = (leadRows ?? []).filter((row) => {
      const created = new Date(row.created_at);
      return created >= date && created < next;
    }).length;
    return { label: dayFormatter.format(date).replace(".", ""), count };
  });
  const maxDailyLeads = Math.max(1, ...days.map((day) => day.count));

  const totalProducts = products?.length ?? 0;
  const active = products?.filter((product) => product.is_active).length ?? 0;
  const inactive = totalProducts - active;
  const totalLeads = leadRows?.length ?? 0;

  return (
    <AdminShell active="dashboard" email={data.claims.email}>
      <section className="admin-content">
        <div className="admin-hero">
          <div>
            <h1>Bem-vindo ao<br />Admin Regtech Motors</h1>
            <p>Gerencie seu catálogo, acompanhe os leads<br />e mantenha sua loja sempre atualizada.</p>
          </div>
          <div className="hero-bike">REGTECH<br /><span>CONTROL</span></div>
        </div>

        <div className="metric-grid">
          <article><em><PackageIcon /></em><div><strong>{totalProducts}</strong><span>Produtos</span></div></article>
          <article><em className="green"><CheckCircleIcon /></em><div><strong>{active}</strong><span>Disponíveis</span></div></article>
          <article><em className="red"><AlertCircleIcon /></em><div><strong>{inactive}</strong><span>Indisponíveis</span></div></article>
          <article><em className="cyan"><UsersIcon /></em><div><strong>{totalLeads}</strong><span>Leads</span></div></article>
        </div>

        <div className="dashboard-grid">
          <article className="panel chart-panel">
            <h2>Leads dos últimos 7 dias</h2>
            <div className="real-chart">
              {days.map((day) => (
                <div className="chart-column" key={day.label}>
                  <span>{day.count}</span>
                  <div style={{ height: `${day.count === 0 ? 3 : Math.max(10, (day.count / maxDailyLeads) * 100)}%` }} />
                  <small>{day.label}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panel-title"><h2>Leads recentes</h2><Link href="/admin/leads">Ver todos →</Link></div>
            <div className="lead-list">
              {recentLeads?.length ? recentLeads.map((lead) => (
                <div key={lead.id}>
                  <i><UserIcon /></i>
                  <span><strong>{lead.full_name ?? "Lead"}</strong><small>{LEAD_STATUS_LABELS[lead.status as LeadStatus] ?? lead.status}</small></span>
                  <time>{new Date(lead.created_at).toLocaleDateString("pt-BR")}</time>
                </div>
              )) : <p>Nenhum lead recebido ainda.</p>}
            </div>
          </article>
        </div>

        <div className="status-strip">
          {LEAD_STATUSES.map((status) => <div key={status}><span>{LEAD_STATUS_LABELS[status]}</span><strong>{statusCounts[status]}</strong></div>)}
        </div>
      </section>
    </AdminShell>
  );
}
