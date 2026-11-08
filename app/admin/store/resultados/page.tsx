import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "../../AdminShell";
import { requireAdminSession } from "../../products/actions";
import { ChartIcon, UsersIcon } from "../../icons";
import { WhatsAppIcon } from "@/components/icons/SiteIcons";
import {
  DEVICE_LABELS,
  STORE_TRACK_SOURCE_LABELS,
  TRAFFIC_SOURCE_LABELS,
  type Device,
  type StoreTrackSource,
  type TrafficSource,
} from "@/lib/analytics/sources";
import { isStaleCart } from "@/lib/cellshop/cart-recovery";
import "../../admin.css";
import "../store.css";

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
  add_to_cart: number;
  daily: { day: string; views: number; clicks: number }[];
  products: { id: string; brand: string; name: string; slug: string; views: number; carts: number; clicks: number }[];
  sources: { source: string; clicks: number }[];
  origins?: { origin: string; visits: number; clicks: number }[];
  devices?: { device: string; visits: number }[];
  cities?: { city: string; region: string | null; visits: number }[];
  hours?: { hour: number; visits: number }[];
  funnel?: { visits: number; saw_product: number; added_to_cart: number; clicked: number };
  first_event_at: string | null;
};

function percent(part: number, total: number) {
  if (total <= 0) return "0%";
  return `${((part / total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`;
}

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

export default async function StoreResultsPage({
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
  const [{ data, error }, { data: cartRows }] = await Promise.all([
    admin.rpc("admin_store_site_stats", { p_from: from.toISOString(), p_to: to.toISOString() }),
    admin
      .from("store_carts")
      .select("status,item_count,updated_at,whatsapp,total,checked_out_at,created_at")
      .gte("created_at", from.toISOString())
      .lt("created_at", to.toISOString())
      .limit(5000),
  ]);
  const stats = (data ?? null) as Stats | null;
  const carts = cartRows ?? [];
  const cartsStale = carts.filter((c) => isStaleCart(c));
  const cartsStaleContact = cartsStale.filter((c) => c.whatsapp).length;
  const cartsSent = carts.filter((c) => c.checked_out_at || c.status === "won").length;
  const staleValue = cartsStale.reduce((sum, c) => sum + Number(c.total ?? 0), 0);

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
  const clicks = stats?.whatsapp_clicks ?? 0;
  const addedToCart = stats?.add_to_cart ?? 0;
  const contactRate = visits > 0 ? (clicks / visits) * 100 : 0;
  const products = stats?.products ?? [];
  const sources = stats?.sources ?? [];
  const maxSource = Math.max(1, ...sources.map((s) => s.clicks));
  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? "";

  const origins = stats?.origins ?? [];
  const maxOrigin = Math.max(1, ...origins.map((o) => o.visits));
  const devices = stats?.devices ?? [];
  const totalDeviceVisits = devices.reduce((sum, d) => sum + d.visits, 0);
  const cities = stats?.cities ?? [];
  const maxCity = Math.max(1, ...cities.map((c) => c.visits));
  const hourMap = new Map((stats?.hours ?? []).map((h) => [h.hour, h.visits]));
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, visits: hourMap.get(hour) ?? 0 }));
  const maxHour = Math.max(1, ...hours.map((h) => h.visits));
  const peakHour = hours.reduce((best, h) => (h.visits > best.visits ? h : best), hours[0]);
  const funnel = stats?.funnel ?? { visits, saw_product: 0, added_to_cart: 0, clicked: 0 };
  const funnelSteps = [
    { label: "Entraram no site", value: funnel.visits },
    { label: "Abriram um produto", value: funnel.saw_product },
    { label: "Colocaram no carrinho", value: funnel.added_to_cart },
    { label: "Chamaram no WhatsApp", value: funnel.clicked },
  ];
  const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <AdminShell active="store" email={claims.claims.email}>
      <section className="admin-content admin-page results-page">
        <div className="page-heading">
          <div>
            <span>REGTECH CELL SHOP</span>
            <h1>Resultados da loja</h1>
            <p>
              Movimento do site da loja no varejo: visitas, produtos mais vistos, carrinhos e contatos pelo WhatsApp.
            </p>
          </div>
          <div className="store-heading-actions">
            <Link href="/admin/store" className="secondary-action">← Voltar para a loja</Link>
            <Link href="/admin/store/carrinhos" className="primary-action">Carrinhos parados</Link>
          </div>
        </div>

        <nav className="results-periods" aria-label="Período">
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={`/admin/store/resultados?periodo=${p.key}`}
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
              ? `Contagem ativa desde ${dateFormatter.format(new Date(stats.first_event_at))}. Só o varejo: acessos da equipe e dos lojistas logados não entram na conta.`
              : "A contagem começa assim que esta atualização estiver no site oficial. Os números aparecem aqui conforme as pessoas visitam a loja."}
          </p>
        )}

        <div className="metric-grid">
          <article>
            <em><UsersIcon /></em>
            <div><strong>{numberFormatter.format(visits)}</strong><span>Visitas</span></div>
          </article>
          <article>
            <em className="cyan"><ChartIcon /></em>
            <div><strong>{numberFormatter.format(addedToCart)}</strong><span>Colocados no carrinho</span></div>
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
            <div className="store-table-title"><h2>Produtos mais vistos</h2></div>
            {products.length === 0 ? (
              <p className="empty-state">Nenhum produto foi visto neste período ainda.</p>
            ) : (
              <table className="admin-table results-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Visualizações</th>
                    <th>No carrinho</th>
                    <th>WhatsApp</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <a href={`https://regtechcellshop.com.br/produto/${product.slug}`} target="_blank" rel="noreferrer">
                          <strong>{product.brand} {product.name}</strong>
                        </a>
                      </td>
                      <td>{numberFormatter.format(product.views)}</td>
                      <td>{numberFormatter.format(product.carts)}</td>
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
                      <span>{STORE_TRACK_SOURCE_LABELS[item.source as StoreTrackSource] ?? item.source}</span>
                      <strong>{numberFormatter.format(item.clicks)}</strong>
                    </div>
                    <i style={{ width: `${(item.clicks / maxSource) * 100}%` }} />
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>

        <article className="panel store-price-mode">
          <div>
            <span>CARRINHOS NESTE PERÍODO</span>
            <h2>{numberFormatter.format(carts.length)} carrinhos montados · {numberFormatter.format(cartsSent)} enviados pelo WhatsApp</h2>
            <p>
              <strong>{numberFormatter.format(cartsStale.length)} parados há mais de 24 horas</strong>
              {staleValue > 0 ? ` (${brl(staleValue)} à vista)` : ""}, sendo {numberFormatter.format(cartsStaleContact)} com WhatsApp para a loja chamar.
            </p>
          </div>
          <Link href="/admin/store/carrinhos" className="admin-primary-button">Ver carrinhos parados</Link>
        </article>

        <div className="results-section-title">
          <h2>Como foi o movimento no site</h2>
          <p>
            Tudo anônimo: ninguém é identificado. A pessoa só aparece para a loja quando chama no WhatsApp ou deixa o contato no carrinho.
          </p>
        </div>

        <div className="results-grid results-grid-even">
          <article className="panel">
            <h2>Caminho dentro do site</h2>
            <p className="results-panel-note">De cada 100 pessoas que entram, quantas chegam a cada etapa.</p>
            <ol className="results-funnel">
              {funnelSteps.map((step, index) => (
                <li key={step.label}>
                  <div>
                    <span><b>{index + 1}</b>{step.label}</span>
                    <strong>
                      {numberFormatter.format(step.value)}
                      <small>{percent(step.value, funnel.visits)}</small>
                    </strong>
                  </div>
                  <i style={{ width: `${funnel.visits > 0 ? Math.max(2, (step.value / funnel.visits) * 100) : 0}%` }} />
                </li>
              ))}
            </ol>
          </article>

          <article className="panel">
            <h2>De onde vieram as visitas</h2>
            <p className="results-panel-note">Visitas e quantas delas chamaram no WhatsApp.</p>
            {origins.length === 0 ? (
              <p className="results-empty">Nenhuma visita neste período ainda.</p>
            ) : (
              <ul className="results-sources results-origins">
                {origins.map((item) => (
                  <li key={item.origin}>
                    <div>
                      <span>{TRAFFIC_SOURCE_LABELS[item.origin as TrafficSource] ?? item.origin}</span>
                      <strong>
                        {numberFormatter.format(item.visits)}
                        {item.clicks > 0 && <small>· {numberFormatter.format(item.clicks)} no WhatsApp</small>}
                      </strong>
                    </div>
                    <i className="views" style={{ width: `${(item.visits / maxOrigin) * 100}%` }} />
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="panel">
            <h2>Aparelhos usados</h2>
            {devices.length === 0 ? (
              <p className="results-empty">Nenhuma visita neste período ainda.</p>
            ) : (
              <ul className="results-devices">
                {devices.map((item) => (
                  <li key={item.device}>
                    <strong>{percent(item.visits, totalDeviceVisits)}</strong>
                    <span>{DEVICE_LABELS[item.device as Device] ?? item.device}</span>
                    <small>{numberFormatter.format(item.visits)} visitas</small>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="panel">
            <h2>Cidades</h2>
            <p className="results-panel-note">Cidade aproximada, informada pela internet de quem acessa.</p>
            {cities.length === 0 ? (
              <p className="results-empty">As cidades aparecem a partir desta atualização.</p>
            ) : (
              <ul className="results-sources results-origins">
                {cities.map((item) => (
                  <li key={item.city}>
                    <div>
                      <span>{item.city}{item.region ? ` · ${item.region}` : ""}</span>
                      <strong>{numberFormatter.format(item.visits)}</strong>
                    </div>
                    <i className="views" style={{ width: `${(item.visits / maxCity) * 100}%` }} />
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>

        <article className="panel results-hours-panel">
          <div className="panel-title">
            <h2>Horários com mais visitas</h2>
            {peakHour.visits > 0 && (
              <span className="results-peak">Pico: {String(peakHour.hour).padStart(2, "0")}h às {String((peakHour.hour + 1) % 24).padStart(2, "0")}h</span>
            )}
          </div>
          <div className="results-chart results-hours" role="img" aria-label="Visitas por horário do dia">
            {hours.map((h) => (
              <div className="results-day" key={h.hour} title={`${String(h.hour).padStart(2, "0")}h: ${h.visits} visitas`}>
                <div className="results-bars">
                  <span className="views" style={{ height: `${h.visits === 0 ? 0 : Math.max(4, (h.visits / maxHour) * 100)}%` }} />
                </div>
                <small>{h.hour % 3 === 0 ? `${String(h.hour).padStart(2, "0")}h` : ""}</small>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AdminShell>
  );
}
