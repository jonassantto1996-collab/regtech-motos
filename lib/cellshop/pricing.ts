/**
 * Regras de preço da Regtech Cell Shop (sem dependência de servidor: usado
 * nas páginas e no simulador de parcelas).
 *
 * - Cliente final vê o preço de varejo; lojista aprovado (Área do Lojista) vê o de atacado.
 * - A versão (variante) pode ter preço próprio; vazio = mesmo preço do produto.
 * - Preço vazio ou zero = "Consulte o valor" (na versão, só o zero; o vazio herda).
 * - Cartão (só no varejo): a tabela de tarifas da loja (CARD_RATES) vale para
 *   todos os produtos, de 1x a 18x, sobre o preço da versão escolhida.
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
  if (variant) {
    const own = mode === "wholesale" ? variant.wholesale_price : variant.price;
    // Preço próprio preenchido (inclusive zero = "Consulte o valor") vale para a versão.
    if (own !== null && own !== undefined && own !== "") return toNumber(own);
  }
  return productPrice(product, mode);
}

export type CardCondition = { total: number; installments: number; parcel: number };

/**
 * Tarifas da maquininha no crédito (tabela da loja), em %: posição 0 = 1x,
 * posição 17 = 18x. Para mudar as taxas, é só trocar os números aqui.
 */
export const CARD_RATES = [4.8, 6.26, 6.9, 7.49, 8.65, 8.65, 9.56, 11.73, 11.73, 12.5, 13.7, 14.3, 15.6, 16.3, 17.8, 18.5, 19.1, 20.5] as const;
export const MAX_INSTALLMENTS = CARD_RATES.length;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Total no cartão em N vezes: preço ÷ (1 − taxa). Assim, depois que a
 * maquininha desconta a taxa, a loja recebe o preço à vista inteiro.
 * Ex.: R$ 1.000 em 10x (12,5%) = R$ 1.142,86 (10x de R$ 114,29).
 */
export function cardTotal(price: number, installments: number): number {
  const rate = CARD_RATES[installments - 1];
  if (rate === undefined || !(price > 0)) return price;
  return round2(price / (1 - rate / 100));
}

/** Todas as opções de parcelamento (1x até 18x) para um preço à vista. */
export function cardPlan(price: number): CardCondition[] {
  return CARD_RATES.map((_, i) => {
    const installments = i + 1;
    const total = cardTotal(price, installments);
    return { installments, total, parcel: round2(total / installments) };
  });
}

/**
 * Maior parcelamento (18x) do preço mostrado, para a vitrine e o topo da
 * página. Vale só para o cliente final (varejo): atacado não tem cartão.
 */
export function cardCondition(_product: PricedProduct, shownPrice: number | null, mode: PriceMode): CardCondition | null {
  if (mode === "wholesale" || shownPrice === null || !(shownPrice > 0)) return null;
  return cardPlan(shownPrice)[MAX_INSTALLMENTS - 1];
}

export function installmentValue(total: number, n: number): number {
  return Math.round((total / n) * 100) / 100;
}

/**
 * Chave "Preços no site" da loja (painel → Loja completa). Desligada, o
 * cliente final vê "Consulte o valor" em tudo; o lojista aprovado continua
 * vendo o atacado.
 */
export function hidesRetailPrices(mode: PriceMode, showRetailPrices: boolean): boolean {
  return mode === "retail" && !showRetailPrices;
}

/** Tira os preços de varejo (produto, cartão e versões) antes de mandar para a página. */
export function stripRetailPrices<T extends PricedProduct & { store_product_variants?: PricedVariant[] }>(product: T): T {
  return {
    ...product,
    price: null,
    card_price: null,
    card_installments: null,
    ...(product.store_product_variants
      ? { store_product_variants: product.store_product_variants.map((v) => ({ ...v, price: null })) }
      : {}),
  };
}

export function priceLabel(mode: PriceMode): string {
  return mode === "wholesale" ? "no atacado" : "à vista";
}
