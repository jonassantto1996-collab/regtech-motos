/**
 * Carrinhos parados (Regtech Cell Shop).
 *
 * O carrinho continua no aparelho do cliente, mas uma cópia vai para o painel
 * (sem dados pessoais). O nome e o WhatsApp só entram quando a própria pessoa
 * preenche e autoriza, no carrinho. Parado = aberto e sem mexer há 24 horas.
 */
import { formatBRL } from "./pricing.ts";

export const STALE_HOURS = 24;
/** Quem deixa o WhatsApp recebe o valor e o pedido fica reservado por 24 horas. */
export const RESERVE_HOURS = 24;
/** Carrinhos guardados por no máximo 90 dias. */
export const RETENTION_DAYS = 90;
export const MAX_SYNC_ITEMS = 50;

const TOKEN = /^[a-z0-9]{24,64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CartStatus = "open" | "checked_out" | "contacted" | "won" | "lost";

export const CART_STATUS_LABEL: Record<CartStatus, string> = {
  open: "Parado no carrinho",
  checked_out: "Enviou pelo WhatsApp",
  contacted: "Loja já chamou",
  won: "Vendido",
  lost: "Não comprou",
};

export function isCartToken(value: unknown): value is string {
  return typeof value === "string" && TOKEN.test(value);
}

export type SyncItem = { productId: string; variantId: string | null; qty: number };

/** Itens que chegam do navegador: só ids e quantidade (preço e nome vêm do banco). */
export function sanitizeSyncItems(raw: unknown): SyncItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: SyncItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const { productId, variantId, qty } = entry as Record<string, unknown>;
    if (typeof productId !== "string" || !UUID.test(productId)) continue;
    const variant = typeof variantId === "string" && UUID.test(variantId) ? variantId : null;
    const key = `${productId}:${variant ?? "-"}`;
    if (seen.has(key)) continue;
    const n = typeof qty === "number" && Number.isFinite(qty) ? Math.round(qty) : 1;
    seen.add(key);
    out.push({ productId, variantId: variant, qty: Math.max(1, Math.min(99, n)) });
    if (out.length >= MAX_SYNC_ITEMS) break;
  }
  return out;
}

export type ContactResult = { ok: true; name: string; whatsapp: string } | { ok: false; error: "name" | "whatsapp" | "consent" };

/** Nome e WhatsApp do cliente: só valem com a autorização marcada. */
export function parseCartContact(name: unknown, whatsapp: unknown, consent: unknown): ContactResult {
  const cleanName = typeof name === "string" ? name.replace(/\s+/g, " ").trim().slice(0, 80) : "";
  if (cleanName.length < 2) return { ok: false, error: "name" };
  let digits = typeof whatsapp === "string" ? whatsapp.replace(/\D/g, "") : "";
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) digits = digits.slice(2);
  if ((digits.length !== 10 && digits.length !== 11) || Number(digits.slice(0, 2)) < 11) return { ok: false, error: "whatsapp" };
  if (consent !== true) return { ok: false, error: "consent" };
  return { ok: true, name: cleanName, whatsapp: digits };
}

/** "(94) 99295-5996" */
export function formatPhone(digits: string): string {
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return digits;
}

/** Parado: aberto, com itens e sem mexer há 24 horas (ou mais). */
export function isStaleCart(cart: { status: string; item_count: number; updated_at: string }, now = Date.now()): boolean {
  return cart.status === "open" && cart.item_count > 0 && now - new Date(cart.updated_at).getTime() >= STALE_HOURS * 3_600_000;
}

/**
 * Para chamar: o cliente deixou o WhatsApp (com autorização) e o carrinho está aberto.
 * Entra na hora, sem esperar 24h, porque a loja prometeu o valor e a reserva.
 * Lojista do atacado (contato do cadastro) só depois de parado.
 */
export function needsCall(
  cart: { status: string; item_count: number; updated_at: string; whatsapp: string | null },
  hasResellerContact = false,
  now = Date.now(),
): boolean {
  if (cart.status !== "open" || cart.item_count <= 0) return false;
  if (cart.whatsapp) return true;
  return hasResellerContact && isStaleCart(cart, now);
}

/** Fim da reserva de 24h, contada a partir da autorização. */
export function reservationEndsAt(consentAt: string | null): Date | null {
  if (!consentAt) return null;
  const start = new Date(consentAt).getTime();
  return Number.isFinite(start) ? new Date(start + RESERVE_HOURS * 3_600_000) : null;
}

/** Reserva ainda valendo? */
export function isReservationActive(consentAt: string | null, now = Date.now()): boolean {
  const end = reservationEndsAt(consentAt);
  return !!end && end.getTime() > now;
}

/** Data limite: carrinhos sem mexer desde antes dela estão parados. */
export function staleCutoffIso(now = Date.now()): string {
  return new Date(now - STALE_HOURS * 3_600_000).toISOString();
}

/** "há 2 dias", "há 5 horas" */
export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return minutes <= 1 ? "agora há pouco" : `há ${minutes} minutos`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "há 1 hora" : `há ${hours} horas`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "há 1 dia" : `há ${days} dias`;
}

export type StoredCartItem = { title: string; variantName: string | null; qty: number; price: number | null };

/** Mensagem pronta para a loja chamar o cliente no WhatsApp. */
export function recoveryMessage(name: string | null, items: StoredCartItem[], total: number, reserved = false): string {
  const first = name ? name.split(" ")[0] : "";
  const list = items
    .slice(0, 5)
    .map((i) => `• ${i.qty > 1 ? `${i.qty}x ` : ""}${i.title}${i.variantName ? ` (${i.variantName})` : ""}`)
    .join("\n");
  const more = items.length > 5 ? `\n• e mais ${items.length - 5} ${items.length - 5 === 1 ? "item" : "itens"}` : "";
  const value = total > 0 ? `\n\nTotal: ${formatBRL(total)} à vista.` : "";
  if (reserved) {
    return (
      `Olá${first ? `, ${first}` : ""}! Aqui é da Regtech Cell Shop. Você pediu o valor destes itens no nosso site:\n${list}${more}${value}\n\n` +
      `Já deixei o seu pedido reservado por ${RESERVE_HOURS}h. Quer que eu te passe as condições de pagamento para fechar?`
    ).replace(/\u00a0/g, " ");
  }
  return (
    `Olá${first ? `, ${first}` : ""}! Aqui é da Regtech Cell Shop. Vi que você deixou estes itens no carrinho do nosso site:\n${list}${more}${value}\n\n` +
    "Ficou alguma dúvida? Posso te ajudar a fechar o pedido ou ver a melhor condição para você."
  ).replace(/\u00a0/g, " ");
}
