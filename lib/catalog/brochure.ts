/**
 * Catálogo em PDF da Regtech Motors (gerado no painel).
 *
 * Três versões:
 * - Varejo: "10x sem juros" (preço à vista dividido por 10) e o valor final.
 * - Atacado: preço de atacado da moto (campo só do painel).
 * - Sem preços ("consulta"): só fotos, cores e ficha, com "Consulte valores".
 *
 * Funções puras: a página só monta o layout com o que sai daqui.
 */
export type BrochureMode = "varejo" | "atacado" | "consulta";

export const BROCHURE_INSTALLMENTS = 10;
export const PRODUCTS_PER_PAGE = 3;

export function parseBrochureMode(value: unknown): BrochureMode {
  return value === "atacado" || value === "consulta" ? value : "varejo";
}

export type BrochurePrice =
  | { kind: "varejo"; installment: number; total: number }
  | { kind: "atacado"; price: number }
  | { kind: "consulte" };

const positive = (value: number | string | null | undefined) => {
  const n = Number(value);
  return value !== null && value !== undefined && value !== "" && Number.isFinite(n) && n > 0 ? n : null;
};

export function brochurePrice(
  mode: BrochureMode,
  product: { price: number | string | null; wholesale_price?: number | string | null },
): BrochurePrice {
  if (mode === "consulta") return { kind: "consulte" };
  if (mode === "atacado") {
    const price = positive(product.wholesale_price);
    return price === null ? { kind: "consulte" } : { kind: "atacado", price };
  }
  const total = positive(product.price);
  if (total === null) return { kind: "consulte" };
  return { kind: "varejo", total, installment: Math.round((total / BROCHURE_INSTALLMENTS) * 100) / 100 };
}

/** 9900 -> { reais: "9.900", cents: "00" } (para o número grande do preço). */
export function moneyParts(value: number): { reais: string; cents: string } {
  const [reais, cents] = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(value)
    .split(",");
  return { reais, cents: cents ?? "00" };
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value).replace(/\u00a0/g, " ");
}

/** "Elétrica" -> "Motos Elétricas" (faixa de título da página). */
export function categoryTitle(category: string): string {
  const key = category.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  if (key.startsWith("eletric")) return "Motos Elétricas";
  if (key.startsWith("combust")) return "Motos a Combustão";
  return category;
}

const COLOR_HEX: [RegExp, string][] = [
  [/^(preto|preta|black)/, "#111111"],
  [/^(branco|branca|white|perola|pérola)/, "#f4f4f4"],
  [/^(vermelho|vermelha|red)/, "#c8102e"],
  [/^(vinho|bordo|bordô)/, "#7a1023"],
  [/^(azul claro|azul-claro|azul bebe|azul bebê)/, "#8fd3f4"],
  [/^(azul)/, "#1d4ed8"],
  [/^(verde agua|verde água|turquesa)/, "#1fb8a8"],
  [/^(verde)/, "#1f7a3a"],
  [/^(amarelo|amarela)/, "#f5c400"],
  [/^(laranja)/, "#f26b1d"],
  [/^(rosa|pink)/, "#f29ac0"],
  [/^(roxo|roxa|lilas|lilás)/, "#7e3fbf"],
  [/^(cinza azulado)/, "#7c8ea3"],
  [/^(cinza|grafite|chumbo|prata|prateado|prateada)/, "#9a9a9a"],
  [/^(bege|creme|caramelo|marrom|nude)/, "#c9a27a"],
  [/^(dourado|dourada)/, "#c9a227"],
];

function colorHex(name: string): string {
  const key = name.toLowerCase().trim();
  return COLOR_HEX.find(([re]) => re.test(key))?.[1] ?? "#9a9a9a";
}

/**
 * Bolinha de cor do catálogo. Cor combinada ("Branca com Laranja",
 * "Vermelho/ Branco") vira bolinha metade de cada cor.
 */
export function colorSwatch(name: string): { label: string; colors: string[] } {
  const parts = name
    .split(/\s*(?:\/|\bcom\b|\be\b|\+)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 2);
  return { label: name.trim(), colors: (parts.length ? parts : [name]).map(colorHex) };
}

export type BrochurePage<T> = { category: string; title: string; items: T[] };

/**
 * Agrupa as motos por categoria (elétricas primeiro) e divide em páginas de 3,
 * como no catálogo original.
 */
export function paginate<T extends { category: string }>(products: T[], perPage = PRODUCTS_PER_PAGE): BrochurePage<T>[] {
  const order = (c: string) => {
    const t = categoryTitle(c);
    return t === "Motos Elétricas" ? 0 : t === "Motos a Combustão" ? 1 : 2;
  };
  const groups = new Map<string, T[]>();
  for (const p of products) {
    const list = groups.get(p.category) ?? [];
    list.push(p);
    groups.set(p.category, list);
  }
  const pages: BrochurePage<T>[] = [];
  for (const category of [...groups.keys()].sort((a, b) => order(a) - order(b) || a.localeCompare(b, "pt-BR"))) {
    const list = groups.get(category)!;
    for (let i = 0; i < list.length; i += perPage) {
      pages.push({ category, title: categoryTitle(category), items: list.slice(i, i + perPage) });
    }
  }
  return pages;
}

/** Ano do catálogo (fuso de Belém). */
export function brochureYear(now = new Date()): string {
  return now.toLocaleDateString("pt-BR", { year: "numeric", timeZone: "America/Belem" });
}
