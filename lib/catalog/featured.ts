/** Quantas motos podem ficar em destaque (as primeiras da Home e do catálogo). */
export const MAX_FEATURED = 4;

/** Próxima posição livre de destaque (1º a 4º), ou null se as 4 já estão ocupadas. */
export function nextFeaturedRank(taken: (number | null | undefined)[], max = MAX_FEATURED): number | null {
  const used = new Set(taken.filter((n): n is number => typeof n === "number"));
  for (let rank = 1; rank <= max; rank++) if (!used.has(rank)) return rank;
  return null;
}
