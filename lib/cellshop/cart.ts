/**
 * Carrinho da Regtech Cell Shop (sem dependência de servidor: roda no
 * navegador e fica guardado no próprio aparelho do cliente).
 *
 * A compra continua sendo fechada no WhatsApp: o carrinho monta uma mensagem
 * única com todos os itens, quantidades, preços e o total.
 */
import { cardPlan, formatBRL, MAX_INSTALLMENTS, type CardCondition, type PriceMode } from "./pricing.ts";

export const MAX_QTY = 99;

export type CartItem = {
  /** produto + versão: o mesmo produto em versões diferentes vira linhas separadas. */
  key: string;
  productId: string;
  variantId: string | null;
  slug: string;
  title: string;
  variantName: string | null;
  /** Preço unitário no momento em que entrou no carrinho (null = consulte o valor). */
  price: number | null;
  imagePath: string | null;
  qty: number;
};

export type NewCartItem = Omit<CartItem, "key" | "qty">;

export function cartKey(productId: string, variantId: string | null): string {
  return `${productId}:${variantId ?? "-"}`;
}

const clampQty = (qty: number) => Math.max(1, Math.min(MAX_QTY, Math.round(qty) || 1));

/** Adiciona (ou soma na linha que já existe). */
export function addItem(items: CartItem[], item: NewCartItem, qty = 1): CartItem[] {
  const key = cartKey(item.productId, item.variantId);
  const existing = items.find((i) => i.key === key);
  if (existing) {
    // Atualiza o preço/nome para o mais recente e soma a quantidade.
    return items.map((i) => (i.key === key ? { ...i, ...item, key, qty: clampQty(i.qty + qty) } : i));
  }
  return [...items, { ...item, key, qty: clampQty(qty) }];
}

export function setQty(items: CartItem[], key: string, qty: number): CartItem[] {
  if (qty <= 0) return removeItem(items, key);
  return items.map((i) => (i.key === key ? { ...i, qty: clampQty(qty) } : i));
}

export function removeItem(items: CartItem[], key: string): CartItem[] {
  return items.filter((i) => i.key !== key);
}

export type CartTotals = {
  /** Quantidade de unidades (soma das quantidades). */
  count: number;
  /** Soma dos itens com preço. */
  total: number;
  /** Algum item está como "consulte o valor". */
  hasUnpriced: boolean;
  /** Maior parcelamento do total (só varejo e só se houver total). */
  card: CardCondition | null;
};

export function cartTotals(items: CartItem[], mode: PriceMode): CartTotals {
  let count = 0;
  let total = 0;
  let hasUnpriced = false;
  for (const item of items) {
    count += item.qty;
    if (item.price !== null && item.price > 0) total += item.price * item.qty;
    else hasUnpriced = true;
  }
  total = Math.round(total * 100) / 100;
  const card = mode === "retail" && total > 0 ? cardPlan(total)[MAX_INSTALLMENTS - 1] : null;
  return { count, total, hasUnpriced, card };
}

/** Lê o carrinho guardado no aparelho, descartando qualquer coisa estranha. */
export function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (i): i is CartItem =>
          !!i &&
          typeof i === "object" &&
          typeof (i as CartItem).productId === "string" &&
          typeof (i as CartItem).slug === "string" &&
          typeof (i as CartItem).title === "string" &&
          typeof (i as CartItem).qty === "number",
      )
      .slice(0, 50)
      .map((i) => ({
        key: cartKey(i.productId, typeof i.variantId === "string" ? i.variantId : null),
        productId: i.productId,
        variantId: typeof i.variantId === "string" ? i.variantId : null,
        slug: i.slug,
        title: i.title.slice(0, 200),
        variantName: typeof i.variantName === "string" ? i.variantName.slice(0, 120) : null,
        price: typeof i.price === "number" && Number.isFinite(i.price) && i.price > 0 ? i.price : null,
        imagePath: typeof i.imagePath === "string" ? i.imagePath : null,
        qty: clampQty(i.qty),
      }));
  } catch {
    return [];
  }
}

/** Mensagem do WhatsApp com o pedido inteiro. */
export function buildCartMessage(
  items: CartItem[],
  options: { mode: PriceMode; baseUrl: string; resellerName?: string | null; installments?: number | null },
): string {
  const base = options.baseUrl.replace(/\/+$/, "");
  const totals = cartTotals(items, options.mode);
  const wholesale = options.mode === "wholesale";
  const lines: string[] = [
    wholesale && options.resellerName
      ? `Olá! Sou da ${options.resellerName} (lojista) e quero fazer este pedido no atacado:`
      : "Olá! Montei este pedido no site da Regtech Cell Shop:",
    "",
  ];

  items.forEach((item, index) => {
    const name = item.variantName ? `${item.title} (${item.variantName})` : item.title;
    const price =
      item.price !== null
        ? item.qty > 1
          ? `${item.qty} x ${formatBRL(item.price)} = ${formatBRL(item.price * item.qty)}`
          : formatBRL(item.price)
        : "consultar valor";
    lines.push(`${index + 1}. ${item.qty > 1 ? `${item.qty}x ` : ""}${name}: ${price}`);
    lines.push(`${base}/produto/${item.slug}`);
  });

  lines.push("");
  if (totals.total > 0) {
    lines.push(`Total${totals.hasUnpriced ? " (sem os itens a consultar)" : ""}: ${formatBRL(totals.total)}${wholesale ? " no atacado" : " à vista"}`);
    if (!wholesale && options.installments && options.installments > 1) {
      const option = cardPlan(totals.total)[Math.min(options.installments, MAX_INSTALLMENTS) - 1];
      lines.push(`No cartão: ${option.installments}x de ${formatBRL(option.parcel)} (total ${formatBRL(option.total)})`);
    }
  }
  lines.push(wholesale ? "Quantas unidades tem disponível?" : "Ainda tem tudo disponível?");
  return lines.join("\n").replace(/ /g, " ");
}
