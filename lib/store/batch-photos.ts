/**
 * Envio de fotos em lote da loja: descobre de qual produto é cada foto pelo
 * nome do arquivo. O nome é o código do produto (o "slug"), com o número da
 * foto no fim: "samsung-galaxy-a17-1.jpg", "samsung-galaxy-a17-2.jpg".
 * Sem número também vale ("samsung-galaxy-a17.jpg").
 */
export const MAX_IMAGES_PER_PRODUCT = 12;

export type BatchProduct = { id: string; slug: string; label: string; imageCount: number };

export type BatchItem<F> = { file: F; fileName: string; order: number };

export type BatchGroup<F> = {
  product: BatchProduct;
  items: BatchItem<F>[];
  /** Fotos que não cabem (o produto aceita até 12 no total). */
  overflow: BatchItem<F>[];
};

export type BatchPlan<F> = { groups: BatchGroup<F>[]; unmatched: string[] };

/** "Samsung Galaxy A17 (1).JPG" -> "samsung-galaxy-a17-1" */
export function normalizeFileBase(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Acha o produto pelo nome do arquivo. Primeiro tenta o nome inteiro (alguns
 * códigos terminam em número, ex.: "xiaomi-redmi-pad-2"); depois tira o
 * número da foto do fim ("xiaomi-redmi-pad-2-1" -> "xiaomi-redmi-pad-2", foto 1).
 */
export function matchFileName(fileName: string, slugs: Set<string>): { slug: string; order: number } | null {
  const base = normalizeFileBase(fileName);
  if (!base) return null;
  if (slugs.has(base)) return { slug: base, order: 0 };
  const numbered = base.match(/^(.+)-(\d{1,2})$/);
  if (numbered && slugs.has(numbered[1])) return { slug: numbered[1], order: Number(numbered[2]) };
  return null;
}

/** Separa as fotos por produto, na ordem do número da foto. */
export function planBatch<F>(files: { file: F; name: string }[], products: BatchProduct[]): BatchPlan<F> {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const slugs = new Set(bySlug.keys());
  const grouped = new Map<string, BatchItem<F>[]>();
  const unmatched: string[] = [];

  for (const { file, name } of files) {
    const match = matchFileName(name, slugs);
    if (!match) {
      unmatched.push(name);
      continue;
    }
    const list = grouped.get(match.slug) ?? [];
    list.push({ file, fileName: name, order: match.order });
    grouped.set(match.slug, list);
  }

  const groups: BatchGroup<F>[] = [];
  for (const [slug, list] of grouped) {
    const product = bySlug.get(slug)!;
    const sorted = [...list].sort((a, b) => a.order - b.order || a.fileName.localeCompare(b.fileName, "pt-BR", { numeric: true }));
    const room = Math.max(0, MAX_IMAGES_PER_PRODUCT - product.imageCount);
    groups.push({ product, items: sorted.slice(0, room), overflow: sorted.slice(room) });
  }
  groups.sort((a, b) => a.product.label.localeCompare(b.product.label, "pt-BR"));
  unmatched.sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
  return { groups, unmatched };
}
