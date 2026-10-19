import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "../AdminShell";
import { requireAdminSession } from "../products/actions";
import { ChartIcon, EyeIcon, UsersIcon } from "../icons";
import { WhatsAppIcon } from "@/components/icons/SiteIcons";
import { TRACK_SOURCE_LABELS, type TrackSource } from "@/lib/analytics/sources";
import "../admin.css";

export const dynamic = "force-dynamic";

const PERIODS = [
  { key: "7d", label: "Últimos 7 dias" },
  { key: "30d", label: "Últimos 30 dias" },
  { key: "mes", label: "Este mês" },
  { key: "mes-passado", label: "Mês passado" },
] as const;
type PeriodKey = (typeof PERIODS)[number]["key"];

type Stats = {
  page_views: number;
  visits: number;
  whatsapp_clicks: number;
  daily: { day: string; views: number; clicks: number }[];
  products: { id: string; brand: string; model: string; slug: string; views: number; clicks: number }[];
  sources: { source: string; clicks: number }[];
  first_event_at: string | null;
};

// Tucumã/PA segue o horário de Belém (UTC-3, sem horário de verão).
const OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day) + OFFSET_MS);
}

function getRange(period: PeriodKey) {
  const local = new Date(Date.now() - OFFSET_MS);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  switch (period) {
    case "7d":
      return { from: startOfDay(y, m, d - 6), to: startOfDay(y, m, d + 1) };
    case "mes":
      return { from: startOfDay(y, m, 1), to: startOfDay(y, m, d + 1) };
    case "mes-passado":
      return { from: startOfDay(y, m - 1, 1), to: startOfDay(y, m, 1) };
    default:
      return { from: startOfDay(y, m, d - 29), to: startOfDay(y, m, d + 1) };
  }
}

const numberFormatter = new Intl.NumberFormat("pt-BR");
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Belem" });

export default async function AdminResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  await requireAdminSession();
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/admin/login");

  const params = await searchParams;
  const period: PeriodKey = PERIODS.some((p) => p.key === params.periodo)
    ? (params.periodo as PeriodKey)
    : "30d";
  const { from, to } = getRange(period);

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("admin_site_stats", {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  const stats = (data ?? null) as Stats | null;

  const dailyMap = new Map((stats?.daily ?? []).map((row) => [row.day, row]));
  const days: { key: string; label: string; views: number; clicks: number }[] = [];
  for (let t = from.getTime(); t < to.getTime(); t += DAY_MS) {
    const key = new Date(t - OFFSET_MS).toISOString().slice(0, 10);
    const row = dailyMap.get(key);
    days.push({
      key,
      label: `${key.slice(8, 10)}/${key.slice(5, 7)}`,
      views: row?.views ?? 0,
      clicks: row?.clicks ?? 0,
    });
  }
  const maxDaily = Math.max(1, ...days.map((day) => day.views));
  const labelEvery = days.length <= 7 ? 1 : days.length <= 16 ? 2 : 5;

  const visits = stats?.visits ?? 0;
  const pageViews = stats?.page_views ?? 0;
  const clicks = stats?.whatsapp_clicks ?? 0;
  const contactRate = visits > 0 ? (clicks / visits) * 100 : 0;
  const products = stats?.products ?? [];
  const sources = stats?.sources ?? [];
  const maxSource = Math.max(1, ...sources.map((s) => s.clicks));
  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? "";

  return (
    <AdminShell active="results" email={claims.claims.email}>
      <section className="admin-content admin-page results-page">
        <div className="page-heading">
          <div>
            <span>COMERCIAL</span>
            <h1>Resultados do site</h1>
            <p>
              Quantas pessoas visitaram o site, quais motos mais chamaram atenção e quantos contatos chegaram pelo WhatsApp.
            </p>
          </div>
        </div>

        <nav className="results-periods" aria-label="Período">
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={`/admin/results?periodo=${p.key}`}
              className={p.key === period ? "is-active" : ""}
              aria-current={p.key === period ? "page" : undefined}
            >
              {p.label}
            </Link>
          ))}
        </nav>

        {error && (
          <p className="admin-alert error" role="alert">
            Não foi possível carregar os resultados agora. Tente novamente em instantes.
          </p>
        )}

        {!error && (
          <p className="results-note">
            {stats?.first_event_at
              ? `Contagem ativa desde ${dateFormatter.format(new Date(stats.first_event_at))}. Acessos da equipe logada no painel não entram na conta.`
              : "A contagem começa assim que esta atualização estiver no site oficial. Os números aparecem aqui conforme as pessoas visitam o site."}
          </p>
        )}

        <div className="metric-grid">
          <article>
            <em><UsersIcon /></em>
            <div><strong>{numberFormatter.format(visits)}</strong><span>Visitas</span></div>
          </article>
          <article>
            <em className="cyan"><EyeIcon /></em>
            <div><strong>{numberFormatter.format(pageViews)}</strong><span>Páginas vistas</span></div>
          </article>
          <article>
            <em className="green"><WhatsAppIcon /></em>
            <div><strong>{numberFormatter.format(clicks)}</strong><span>Cliques no WhatsApp</span></div>
          </article>
          <article>
            <em className="green"><ChartIcon /></em>
            <div>
              <strong>{contactRate.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</strong>
              <span>Visitas que chamaram no WhatsApp</span>
            </div>
          </article>
        </div>

        <article className="panel results-chart-panel">
          <div className="panel-title">
            <h2>Páginas vistas por dia · {periodLabel}</h2>
            <div className="results-legend" aria-hidden>
              <span><i className="views" />Páginas vistas</span>
              <span><i className="clicks" />Cliques no WhatsApp</span>
            </div>
          </div>
          <div className="results-chart" role="img" aria-label={`Páginas vistas e cliques no WhatsApp por dia, ${periodLabel.toLowerCase()}`}>
            {days.map((day, index) => (
              <div className="results-day" key={day.key} title={`${day.label}: ${day.views} páginas vistas, ${day.clicks} cliques no WhatsApp`}>
                <div className="results-bars">
                  <span className="views" style={{ height: `${day.views === 0 ? 0 : Math.max(4, (day.views / maxDaily) * 100)}%` }} />
                  <span className="clicks" style={{ height: `${day.clicks === 0 ? 0 : Math.max(4, (day.clicks / maxDaily) * 100)}%` }} />
                </div>
                <small>{index % labelEvery === 0 || index === days.length - 1 ? day.label : ""}</small>
              </div>
            ))}
          </div>
        </article>

        <div className="results-grid">
          <article className="panel admin-table-wrap">
            <div className="store-table-title"><h2>Motos mais vistas</h2></div>
            {products.length === 0 ? (
              <p className="empty-state">Nenhuma moto foi vista neste período ainda.</p>
            ) : (
              <table className="admin-table results-table">
                <thead>
                  <tr>
                    <th>Moto</th>
                    <th>Visualizações</th>
                    <th>Cliques no WhatsApp</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <a href={`/products/${product.slug}`} target="_blank" rel="noreferrer">
                          <strong>{product.brand} {product.model}</strong>
                        </a>
                      </td>
                      <td>{numberFormatter.format(product.views)}</td>
                      <td>{numberFormatter.format(product.clicks)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </article>

          <article className="panel">
            <h2>De onde vieram os cliques no WhatsApp</h2>
            {sources.length === 0 ? (
              <p className="results-empty">Nenhum clique no WhatsApp neste período ainda.</p>
            ) : (
              <ul className="results-sources">
                {sources.map((item) => (
                  <li key={item.source}>
                    <div>
                      <span>{TRACK_SOURCE_LABELS[item.source as TrackSource] ?? item.source}</span>
                      <strong>{numberFormatter.format(item.clicks)}</strong>
                    </div>
                    <i style={{ width: `${(item.clicks / maxSource) * 100}%` }} />
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </section>
    </AdminShell>
  );
}
