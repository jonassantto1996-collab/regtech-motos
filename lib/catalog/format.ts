/**
 * Formata um preço numérico como moeda brasileira (ex: 4900 -> "R$ 4.900,00").
 */
export function formatPriceBRL(price: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

/**
 * Texto da condição no cartão, ex.: "12x de R$ 875,00 no cartão".
 * Retorna null quando a moto não tem valor no cartão cadastrado.
 */
export function formatCardInstallments(
  cardPrice: number | null | undefined,
  installments: number | null | undefined
): string | null {
  if (!cardPrice || !installments || installments < 1) return null;
  const parcela = Math.round((cardPrice / installments) * 100) / 100;
  return `${installments}x de ${formatPriceBRL(parcela)} no cartão`;
}
