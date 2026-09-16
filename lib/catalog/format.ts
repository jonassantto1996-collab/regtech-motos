/**
 * Formata um preço numérico como moeda brasileira (ex: 4900 -> "R$ 4.900,00").
 */
export function formatPriceBRL(price: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}
