/**
 * Regras de preço da Regtech Cell Shop (sem dependência de servidor: usado
 * nas páginas e no simulador de parcelas).
 *
 * - O painel escolhe qual preço o site mostra: atacado ou varejo.
 * - A versão (variante) pode ter preço próprio; vazio = mesmo preço do produto.
 * - Preço vazio ou zero = "Consulte o valor".
 * - A condição no cartão (total + parcelas) é do produto; só aparece quando
 *   a versão escolhida custa o mesmo que o produto, para não mostrar parcela errada.
 */
export type PriceMode = "wholesale" | "retail";
export type Money = number | string | null | undefined;

export function toNumber(value: Money): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export type PricedProduct = {
  price: Money;
  wholesale_price: Money;
  card_price: Money;
  card_installments: number | null;
};

export type PricedVariant = { price: Money; wholesale_price: Money };

export function productPrice(product: PricedProduct, mode: PriceMode): number | null {
  return toNumber(mode === "wholesale" ? product.wholesale_price : product.price);
}

export function variantPrice(product: PricedProduct, variant: PricedVariant | null, mode: PriceMode): number | null {
  const own = variant ? toNumber(mode === "wholesale" ? variant.wholesale_price : variant.price) : null;
  return own ?? productPrice(product, mode);
}

export type CardCondition = { total: number; installments: number; parcel: number };

/** Condição no cartão válida para o preço mostrado (ou null). */
export function cardCondition(product: PricedProduct, shownPrice: number | null, mode: PriceMode): CardCondition | null {
  const total = toNumber(product.card_price);
  const installments = product.card_installments ?? 0;
  if (!total || installments < 1) return null;
  if (shownPrice !== null && shownPrice !== productPrice(product, mode)) return null;
  return { total, installments, parcel: Math.round((total / installments) * 100) / 100 };
}

export function installmentValue(total: number, n: number): number {
  return Math.round((total / n) * 100) / 100;
}

export function priceLabel(mode: PriceMode): string {
  return mode === "wholesale" ? "no atacado" : "à vista";
}
