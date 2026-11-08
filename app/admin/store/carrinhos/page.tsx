import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "../../AdminShell";
import { requireAdminSession } from "../../products/actions";
import { DEVICE_LABELS, TRAFFIC_SOURCE_LABELS, type Device, type TrafficSource } from "@/lib/analytics/sources";
import {
  CART_STATUS_LABEL,
  formatPhone,
  isStaleCart,
  recoveryMessage,
  STALE_HOURS,
  timeAgo,
  type CartStatus,
  type StoredCartItem,
} from "@/lib/cellshop/cart-recovery";
import { saveCartNote, setCartStatus } from "./actions";
import "../../admin.css";
import "../store.css";

export const dynamic = "force-dynamic";

type CartRow = {
  id: string;
  mode: "retail" | "wholesale";
  items: (StoredCartItem & { slug: string })[];
  item_count: number;
  total: number | string;
  has_unpriced: boolean;
  contact_name: string | null;
  whatsapp: string | null;
  status: CartStatus;
  checked_out_at: string | null;
  admin_note: string | null;
  device: string | null;
  traffic_source: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
  store_resellers: { store_name: string; contact_name: string; whatsapp: string } | null;
};

type FilterKey = "chamar" | "anonimos" | "abertos" | "chamados" | "enviados" | "resolvidos" | "todos";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "chamar", label: "Para chamar" },
  { key: "anonimos", label: "Parados sem contato" },
  { key: "abertos", label: `Abertos (menos de ${STALE_HOURS}h)` },
  { key: "chamados", label: "Já chamados" },
  { key: "enviados", label: "Enviados pelo WhatsApp" },
  { key: "resolvidos", label: "Vendidos / não compraram" },
  { key: "todos", label: "Todos" },
];

const SAVED: Record<string, string> = {
  contacted: "Marcado como chamado.",
  won: "Marcado como vendido.",
  lost: "Marcado como “não comprou”.",
  open: "Carrinho voltou para a lista.",
  note: "Observação salva.",
};

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Belem" });

/** WhatsApp para chamar: o que o cliente deixou ou, no atacado, o do lojista. */
function contactOf(cart: CartRow) {
  if (cart.whatsapp) return { name: cart.contact_name, whatsapp: cart.whatsapp };
  if (cart.mode === "wholesale" && cart.store_resellers) {
    return { name: cart.store_resellers.contact_name, whatsapp: cart.store_resellers.whatsapp };
  }
  return null;
}

function matches(cart: CartRow, filter: FilterKey) {
  const stale = isStaleCart(cart);
  const contact = contactOf(cart);
  switch (filter) {
    case "chamar":
      return stale && !!contact;
    case "anonimos":
      return stale && !contact;
    case "abertos":
      return cart.status === "open" && !stale;
    case "chamados":
      return cart.status === "contacted";
    case "enviados":
      return cart.status === "checked_out";
    case "resolvidos":
      return cart.status === "won" || cart.status === "lost";
    default:
      return true;
  }
}

export default async function StoreCartsPage({ searchParams }: { searchParams: Promise<{ filtro?: string; saved?: string; error?: string }> }) {
  await requireAdminSession();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/login");

  const { filtro, saved, error } = await searchParams;
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("store_carts")
    .select(
      "id,mode,items,item_count,total,has_unpriced,contact_name,whatsapp,status,checked_out_at,admin_note,device,traffic_source,city,created_at,updated_at,store_resellers(store_name,contact_name,whatsapp)",
    )
    .order("updated_at", { ascending: false })
    .limit(1000);
  const all = (rows ?? []) as unknown as CartRow[];
  const counts = Object.fromEntries(FILTERS.map((f) => [f.key, all.filter((c) => matches(c, f.key)).length])) as Record<FilterKey, number>;
  const filter: FilterKey = FILTERS.some((f) => f.key === filtro) ? (filtro as FilterKey) : counts.chamar ? "chamar" : "anonimos";
  const list = all.filter((c) => matches(c, filter));
  const staleValue = all.filter((c) => isStaleCart(c)).reduce((sum, c) => sum + Number(c.total ?? 0), 0);

  return (
    <AdminShell active="store" email={typeof data.claims.email === "string" ? data.claims.email : undefined}>
      <section className="admin-content admin-page">
        <div className="page-heading">
          <div>
            <span>REGTECH CELL SHOP</span>
            <h1>Carrinhos parados</h1>
            <p>
              Carrinhos montados no site que ficaram mais de {STALE_HOURS} horas sem ser enviados. Quem deixou o WhatsApp (com autorização)
              aparece em “Para chamar”, com a mensagem pronta.
              {staleValue > 0 ? ` Valor parado agora: ${brl(staleValue)} à vista.` : ""}
            </p>
          </div>
          <div className="store-heading-actions">
            <Link href="/admin/store" className="secondary-action">← Voltar para a loja</Link>
            <Link href="/admin/store/resultados" className="secondary-action">Resultados da loja</Link>
            <a href="/admin/store/carrinhos/export" className="secondary-action">Exportar planilha</a>
          </div>
        </div>

        {saved && SAVED[saved] && <p className="admin-alert success" role="status">{SAVED[saved]}</p>}
        {error && <p className="admin-alert error" role="alert">Não foi possível salvar. Tente de novo.</p>}

        <nav className="reseller-filters" aria-label="Filtrar carrinhos">
          {FILTERS.map((f) => (
            <Link key={f.key} href={`/admin/store/carrinhos?filtro=${f.key}`} className={filter === f.key ? "is-active" : ""} aria-current={filter === f.key ? "page" : undefined}>
              {f.label}
              <span>{counts[f.key]}</span>
            </Link>
          ))}
        </nav>

        <article className="panel batch-panel">
          {list.length === 0 ? (
            <p className="form-muted">
              {all.length === 0
                ? "Nenhum carrinho ainda. Eles aparecem aqui quando alguém coloca produtos no carrinho do site."
                : "Nenhum carrinho neste filtro."}
            </p>
          ) : (
            <ul className="reseller-list">
              {list.map((cart) => {
                const contact = contactOf(cart);
                const total = Number(cart.total ?? 0);
                const message = recoveryMessage(contact?.name ?? null, cart.items, total);
                const title =
                  cart.mode === "wholesale" && cart.store_resellers
                    ? `${cart.store_resellers.store_name} (lojista)`
                    : cart.contact_name ?? "Cliente sem contato";
                const origin = cart.traffic_source ? TRAFFIC_SOURCE_LABELS[cart.traffic_source as TrafficSource] : null;
                const device = cart.device ? DEVICE_LABELS[cart.device as Device] : null;
                return (
                  <li key={cart.id} className="reseller-row">
                    <div className="reseller-head">
                      <div>
                        <strong>{title}</strong>
                        <small>
                          Mexeu {timeAgo(cart.updated_at)} · {dateTime.format(new Date(cart.updated_at))}
                          {[origin, device, cart.city].filter(Boolean).length ? ` · ${[origin, device, cart.city].filter(Boolean).join(" · ")}` : ""}
                        </small>
                      </div>
                      <span className={`reseller-status cart-status is-${cart.status}`}>
                        {isStaleCart(cart) ? `Parado há mais de ${STALE_HOURS}h` : CART_STATUS_LABEL[cart.status]}
                      </span>
                    </div>

                    <ul className="cart-items">
                      {cart.items.map((item, i) => (
                        <li key={`${item.slug}-${i}`}>
                          <a href={`https://regtechcellshop.com.br/produto/${item.slug}`} target="_blank" rel="noreferrer">
                            {item.qty > 1 ? `${item.qty}x ` : ""}
                            {item.title}
                            {item.variantName ? ` (${item.variantName})` : ""}
                          </a>
                          <span>{item.price !== null ? brl(item.price * item.qty) : "consultar"}</span>
                        </li>
                      ))}
                      <li className="cart-total">
                        <strong>Total {cart.mode === "wholesale" ? "no atacado" : "à vista"}</strong>
                        <strong>
                          {brl(total)}
                          {cart.has_unpriced ? " + itens a consultar" : ""}
                        </strong>
                      </li>
                    </ul>

                    <div className="reseller-actions">
                      {contact ? (
                        <a
                          className="admin-primary-button"
                          href={`https://wa.me/55${contact.whatsapp}?text=${encodeURIComponent(message)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Chamar no WhatsApp · {formatPhone(contact.whatsapp)}
                        </a>
                      ) : (
                        <span className="form-muted">Sem contato: o cliente não deixou o WhatsApp.</span>
                      )}
                      {cart.status !== "contacted" && contact && (
                        <form action={setCartStatus.bind(null, cart.id, "contacted", filter)}>
                          <button type="submit" className="admin-secondary-button">Já chamei</button>
                        </form>
                      )}
                      {cart.status !== "won" && (
                        <form action={setCartStatus.bind(null, cart.id, "won", filter)}>
                          <button type="submit" className="admin-secondary-button">Vendeu</button>
                        </form>
                      )}
                      {cart.status !== "lost" && (
                        <form action={setCartStatus.bind(null, cart.id, "lost", filter)}>
                          <button type="submit" className="admin-secondary-button reseller-danger">Não comprou</button>
                        </form>
                      )}
                      {(cart.status === "won" || cart.status === "lost" || cart.status === "contacted") && (
                        <form action={setCartStatus.bind(null, cart.id, "open", filter)}>
                          <button type="submit" className="admin-secondary-button">Voltar para a lista</button>
                        </form>
                      )}
                    </div>

                    <form action={saveCartNote.bind(null, cart.id, filter)} className="reseller-notes">
                      <label className="admin-field">
                        Observação interna
                        <input name="admin_note" className="admin-control" defaultValue={cart.admin_note ?? ""} maxLength={500} placeholder="Ex.: pediu para chamar depois do dia 10" />
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
