/**
 * Foto por cor: cada foto do produto pode ter uma cor ("Rosa", "Preto"...).
 * Ao escolher a versão na página do produto, a galeria vai para a foto da cor
 * daquela versão. Foto sem cor = foto geral (ex.: a caixa), vale para todas.
 */

export type ColoredPhoto = { storage_path: string; color?: string | null };
export type StockedVariant = { name: string; stock_quantity: number };

/** Pedaços que não são cor: armazenamento, memória, bateria. */
const NOT_A_COLOR = /\d|\bgb\b|\btb\b|\bram\b|bateria/i;

/** "128 GB · Roxo · Bateria 81%" → "Roxo". Sem cor no nome → null. */
export function variantColor(name: string | null | undefined): string | null {
  if (!name) return null;
  const parts = name
    .split("·")
    .map((part) => part.trim())
    .filter((part) => part && !NOT_A_COLOR.test(part));
  return parts.length ? parts[parts.length - 1] : null;
}

/** Compara sem acento, sem maiúsculas e sem o que está entre parênteses. */
export function colorKey(color: string): string {
  return color
    .replace(/\(.*?\)/g, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function sameColor(a: string | null | undefined, b: string | null | undefined): boolean {
  return !!a && !!b && colorKey(a) === colorKey(b);
}

/** Posição da primeira foto daquela cor (ou -1). */
export function photoIndexForColor(photos: ColoredPhoto[], color: string | null): number {
  if (!color) return -1;
  return photos.findIndex((photo) => sameColor(photo.color, color));
}

/**
 * Foto que abre a página: a principal, a não ser que ela seja de outra cor
 * (ex.: principal preta e a versão escolhida é a branca).
 */
export function initialPhotoIndex(photos: ColoredPhoto[], color: string | null): number {
  const main = photos[0];
  if (!main?.color || !color || sameColor(main.color, color)) return 0;
  const index = photoIndexForColor(photos, color);
  return index >= 0 ? index : 0;
}

/** Versão que já vem marcada: a primeira com estoque. */
export function defaultVariant<T extends StockedVariant>(variants: T[]): T | null {
  return variants.find((v) => v.stock_quantity > 0) ?? variants[0] ?? null;
}

/** Nome da versão sem a cor: "128 GB · Roxo" → "128 GB". */
function withoutColor(name: string): string {
  const color = variantColor(name);
  return name
    .split("·")
    .map((part) => part.trim())
    .filter((part) => part && part !== color)
    .join(" · ");
}

/**
 * Versão daquela cor (a pessoa passou para a foto de outra cor na galeria).
 * Prefere a que mantém o resto igual à versão atual (ex.: mesmo armazenamento)
 * e, entre elas, a que tem estoque. Nenhuma versão daquela cor → null.
 */
export function variantForColor<T extends StockedVariant>(variants: T[], color: string | null | undefined, current?: T | null): T | null {
  if (!color) return null;
  const rest = current ? withoutColor(current.name) : null;
  let best: T | null = null;
  let bestScore = -1;
  for (const v of variants) {
    if (!sameColor(variantColor(v.name), color)) continue;
    const score = (rest !== null && withoutColor(v.name) === rest ? 2 : 0) + (v.stock_quantity > 0 ? 1 : 0);
    if (score > bestScore) {
      best = v;
      bestScore = score;
    }
  }
  return best;
}

/**
 * Versão que já vem marcada ao abrir a página: a da cor da foto principal
 * (se tiver estoque), para a foto e a versão escolhida baterem. Senão, a
 * primeira com estoque.
 */
export function initialVariant<T extends StockedVariant>(variants: T[], photos: ColoredPhoto[] = []): T | null {
  const byPhoto = variantForColor(variants, photos[0]?.color);
  return byPhoto && byPhoto.stock_quantity > 0 ? byPhoto : defaultVariant(variants);
}

/** Cores das versões, sem repetir (para escolher a cor de cada foto no painel). */
export function colorOptions(variantNames: string[]): string[] {
  const seen = new Map<string, string>();
  for (const name of variantNames) {
    const color = variantColor(name);
    if (color && !seen.has(colorKey(color))) seen.set(colorKey(color), color);
  }
  return [...seen.values()];
}
