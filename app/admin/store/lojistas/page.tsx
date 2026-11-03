import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "../../AdminShell";
import { requireAdminSession } from "../../products/actions";
import { ResellerPasswordReset } from "../components/ResellerPasswordReset";
import { RESELLER_STATUS_LABEL, formatDocument, formatWhatsapp, type ResellerStatus } from "@/lib/store/resellers";
import { saveResellerNotes, setResellerStatus } from "./actions";
import "../../admin.css";
import "../store.css";

export const dynamic = "force-dynamic";

type Reseller = {
  id: string;
  contact_name: string;
  store_name: string;
  document: string;
  whatsapp: string;
  city: string;
  email: string;
  status: ResellerStatus;
  admin_notes: string | null;
  created_at: string;
  approved_at: string | null;
};

const FILTERS: { key: "all" | ResellerStatus; label: string }[] = [
  { key: "pending", label: "Em análise" },
  { key: "approved", label: "Aprovados" },
  { key: "rejected", label: "Recusados" },
  { key: "blocked", label: "Bloqueados" },
  { key: "all", label: "Todos" },
];

const SAVED: Record<string, string> = {
  approved: "Lojista aprovado. Avise pelo WhatsApp: ele já vê os preços de atacado.",
  rejected: "Cadastro recusado.",
  blocked: "Lojista bloqueado. Ele volta a ver os preços de varejo.",
  pending: "Cadastro voltou para análise.",
  notes: "Observação salva.",
};

function date(value: string | null) {
  return value ? new Date(value).toLocaleDateString("pt-BR", { timeZone: "America/Belem" }) : "";
}

export default async function StoreResellersPage({ searchParams }: { searchParams: Promise<{ status?: string; saved?: string; error?: string }> }) {
  await requireAdminSession();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/login");

  const { status, saved, error } = await searchParams;
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("store_resellers")
    .select("id,contact_name,store_name,document,whatsapp,city,email,status,admin_notes,created_at,approved_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  const all = (rows ?? []) as Reseller[];
  const counts = all.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});
  const filter = FILTERS.some((f) => f.key === status) ? (status as "all" | ResellerStatus) : counts.pending ? "pending" : "all";
  const list = filter === "all" ? all : all.filter((r) => r.status === filter);

  return (
    <AdminShell active="store" email={typeof data.claims.email === "string" ? data.claims.email : undefined}>
      <section className="admin-content admin-page">
        <div className="page-heading">
          <div>
            <span>REGTECH CELL SHOP</span>
            <h1>Lojistas (atacado)</h1>
            <p>Quem você aprovar aqui entra na Área do Lojista do site e vê os preços de atacado. O cliente final vê o varejo.</p>
          </div>
          <div className="store-heading-actions">
            <Link href="/admin/store" className="secondary-action">← Voltar para a loja</Link>
            <a href="/admin/store/lojistas/export" className="secondary-action">Exportar planilha</a>
          </div>
        </div>

        {saved && SAVED[saved] && <p className="admin-alert success" role="status">{SAVED[saved]}</p>}
        {error && <p className="admin-alert error" role="alert">Não foi possível salvar. Tente de novo.</p>}

        <nav className="reseller-filters" aria-label="Filtrar lojistas">
          {FILTERS.map((f) => (
            <Link key={f.key} href={`/admin/store/lojistas?status=${f.key}`} className={filter === f.key ? "is-active" : ""} aria-current={filter === f.key ? "page" : undefined}>
              {f.label}
              <span>{f.key === "all" ? all.length : counts[f.key] ?? 0}</span>
            </Link>
          ))}
        </nav>

        <article className="panel batch-panel">
          {list.length === 0 ? (
            <p className="form-muted">
              {all.length === 0
                ? "Nenhum lojista cadastrado ainda. O cadastro fica no site, em “Área do Lojista”."
                : "Nenhum lojista neste filtro."}
            </p>
          ) : (
            <ul className="reseller-list">
              {list.map((r) => {
                const approveText = `Olá, ${r.contact_name.split(" ")[0]}! Aqui é da Regtech Cell Shop. O cadastro da ${r.store_name} foi aprovado: entre na Área do Lojista do site com o seu e-mail e senha para ver os preços de atacado. https://regtechcellshop.com.br/lojista`;
                return (
                  <li key={r.id} className={`reseller-row is-${r.status}`}>
                    <div className="reseller-head">
                      <div>
                        <strong>{r.store_name}</strong>
                        <small>
                          {r.contact_name} · {r.city}
                        </small>
                      </div>
                      <span className={`reseller-status is-${r.status}`}>{RESELLER_STATUS_LABEL[r.status]}</span>
                    </div>

                    <dl className="reseller-data">
                      <div><dt>CNPJ/CPF</dt><dd>{formatDocument(r.document)}</dd></div>
                      <div>
                        <dt>WhatsApp</dt>
                        <dd><a href={`https://wa.me/55${r.whatsapp}`} target="_blank" rel="noreferrer">{formatWhatsapp(r.whatsapp)}</a></dd>
                      </div>
                      <div><dt>E-mail</dt><dd>{r.email}</dd></div>
                      <div><dt>Cadastro</dt><dd>{date(r.created_at)}{r.approved_at && r.status === "approved" ? ` · aprovado em ${date(r.approved_at)}` : ""}</dd></div>
                    </dl>

                    <div className="reseller-actions">
                      {r.status !== "approved" && (
                        <form action={setResellerStatus.bind(null, r.id, "approved")}>
                          <button type="submit" className="admin-primary-button">Aprovar</button>
                        </form>
                      )}
                      {r.status === "approved" && (
                        <a className="admin-secondary-button" href={`https://wa.me/55${r.whatsapp}?text=${encodeURIComponent(approveText)}`} target="_blank" rel="noreferrer">
                          Avisar aprovação no WhatsApp
                        </a>
                      )}
                      {r.status === "pending" && (
                        <form action={setResellerStatus.bind(null, r.id, "rejected")}>
                          <button type="submit" className="admin-secondary-button">Recusar</button>
                        </form>
                      )}
                      {r.status === "approved" && (
                        <form action={setResellerStatus.bind(null, r.id, "blocked")}>
                          <button type="submit" className="admin-secondary-button reseller-danger">Bloquear</button>
                        </form>
                      )}
                      <ResellerPasswordReset resellerId={r.id} whatsapp={r.whatsapp} storeName={r.store_name} />
                    </div>

                    <form action={saveResellerNotes.bind(null, r.id)} className="reseller-notes">
                      <label className="admin-field">
                        Observação interna (o lojista não vê)
                        <input name="admin_notes" className="admin-control" defaultValue={r.admin_notes ?? ""} maxLength={500} placeholder="Ex.: compra toda semana, prefere PIX" />
                      </label>
                      <button type="submit" className="admin-secondary-button">Salvar</button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </section>
    </AdminShell>
  );
}
