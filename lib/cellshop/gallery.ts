/**
 * Galeria do produto (Regtech Cell Shop): a foto grande desliza com o dedo.
 * Funções puras para achar a foto pela posição da rolagem e andar pelas setas.
 */

/** Qual foto está na caixa, pela posição da rolagem (arredonda para a mais próxima). */
export function slideFromScroll(scrollLeft: number, width: number, count: number): number {
  if (count <= 0 || width <= 0) return 0;
  const i = Math.round(Math.abs(scrollLeft) / width);
  return Math.max(0, Math.min(count - 1, i));
}

/** Próxima/anterior pelas setas, sem passar do começo nem do fim. */
export function stepSlide(index: number, delta: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(count - 1, index + delta));
}
