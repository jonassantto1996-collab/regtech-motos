import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { logout } from "./actions";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/leads/types";
import "./admin.css";

const icons={dashboard:"⌂",motos:"◈",loja:"▣",leads:"●",atendimento:"◉",config:"⚙"};

export default async function AdminPage() {
  const supabase=await createClient();
  const {data}=await supabase.auth.getClaims();
  if(!data?.claims) redirect("/admin/login");
  const admin=createAdminClient();
  const [{data:leadRows},{data:products},{data:recentLeads}]=await Promise.all([
    admin.from("leads").select("status"),
    admin.from("products").select("id,is_active,availability"),
    admin.from("leads").select("id,name,status,created_at").order("created_at",{ascending:false}).limit(5),
  ]);
  const statusCounts:Record<LeadStatus,number>={NOVO:0,EM_ATENDIMENTO:0,INTERESSADO:0,VENDA_REALIZADA:0,NAO_CONVERTIDO:0};
  for(const row of (leadRows??[]) as {status:LeadStatus}[]) if(statusCounts[row.status]!==undefined) statusCounts[row.status]++;
  const totalProducts=products?.length??0;
  const active=products?.filter((p:any)=>p.is_active).length??0;
  const inactive=totalProducts-active;
  const totalLeads=leadRows?.length??0;
  return <div className="admin-shell">
    <aside className="admin-side">
      <div className="admin-logo">REGTECH <span>MOTORS</span></div>
      <nav>
        <Link className="nav-active" href="/admin">{icons.dashboard} <span>Dashboard</span></Link>
        <small>CATÁLOGO</small>
        <Link href="/admin/products">{icons.motos} <span>Motos</span></Link>
        <div className="nav-soon">{icons.loja} <span>Loja</span><b>Em breve</b></div>
        <small>COMERCIAL</small>
        <Link href="/admin/leads">{icons.leads} <span>Leads</span></Link>
        <div className="nav-muted">{icons.atendimento} <span>Atendimentos</span></div>
        <small>SISTEMA</small>
        <div className="nav-muted">{icons.config} <span>Configurações</span></div>
      </nav>
      <div className="side-message"><strong>A mesma paixão que move você,</strong><br/>agora em toda gestão.</div>
    </aside>
    <main className="admin-main">
      <header className="admin-top"><div className="mobile-brand">REGTECH <span>MOTORS</span></div><div className="admin-search">⌕ &nbsp; Buscar no admin...</div><div className="admin-user"><i>{(data.claims.email??"A").slice(0,1).toUpperCase()}</i><span><strong>Admin Regtech</strong><small>Administrador</small></span></div></header>
      <section className="admin-content">
        <div className="admin-hero"><div><h1>Bem-vindo ao<br/>Admin Regtech Motors</h1><p>Gerencie seu catálogo, acompanhe os leads<br/>e mantenha sua loja sempre atualizada.</p></div><div className="hero-bike">REGTECH<br/><span>CONTROL</span></div></div>
        <div className="metric-grid">
          <article><em>◉</em><div><strong>{totalProducts}</strong><span>Produtos</span></div></article>
          <article><em className="green">●</em><div><strong>{active}</strong><span>Disponíveis</span></div></article>
          <article><em className="red">●</em><div><strong>{inactive}</strong><span>Indisponíveis</span></div></article>
          <article><em className="cyan">●</em><div><strong>{totalLeads}</strong><span>Leads</span></div></article>
        </div>
        <div className="dashboard-grid">
          <article className="panel chart-panel"><h2>Leads dos últimos 7 dias</h2><div className="fake-chart"><div/><div/><div/><div/><div/><div/><div/></div><div className="chart-days"><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span></div></article>
          <article className="panel"><div className="panel-title"><h2>Leads recentes</h2><Link href="/admin/leads">Ver todos →</Link></div>
          <div className="lead-list">{recentLeads?.length?(recentLeads as any[]).map(l=><div key={l.id}><i>◉</i><span><strong>{l.name??"Lead"}</strong><small>{LEAD_STATUS_LABELS[l.status as LeadStatus]??l.status}</small></span><time>{new Date(l.created_at).toLocaleDateString("pt-BR")}</time></div>):<p>Nenhum lead recebido ainda.</p>}</div></article>
        </div>
        <div className="status-strip">{LEAD_STATUSES.map(s=><div key={s}><span>{LEAD_STATUS_LABELS[s]}</span><strong>{statusCounts[s]}</strong></div>)}</div>
        <form action={logout}><button className="logout" type="submit">Sair do admin</button></form>
      </section>
    </main>
  </div>
}