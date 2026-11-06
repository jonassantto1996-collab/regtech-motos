/**
 * Busca da vitrine da Regtech Cell Shop (sem dependência de servidor: roda no
 * navegador enquanto o cliente digita).
 *
 * - Sem acento e sem diferenciar maiúsculas ("iphone" acha "iPhone").
 * - Procura na marca, no nome, nas versões e na categoria do produto.
 * - Todas as palavras precisam aparecer ("galaxy a17" não traz o A07).
 * - Referência com ou sem traço/espaço: "6504", "ncb6504" e "NCB-6504" acham o
 *   mesmo produto (também procura no código interno, quando houver).
 * - Alguns apelidos comuns: "apple" acha iPhone e iPad; "tablet" acha iPad;
 *   "celular" acha smartphones e iPhone; "caixa de som" acha Bombox.
 */
export type SearchableProduct = {
  brand: string;
  name: string;
  store_product_variants: { name: string }[];
  /** Código interno (só o painel usa). */
  sku?: string | null;
};

export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Palavra digitada → outras palavras que também valem como acerto. */
const ALIASES: Record<string, string[]> = {
  apple: ["iphone", "ipad"],
  tablet: ["ipad", "tablets"],
  tablets: ["ipad", "tablet"],
  celular: ["smartphone", "smartphones", "iphone"],
  celulares: ["smartphone", "smartphones", "iphone"],
  telefone: ["smartphone", "smartphones", "iphone"],
  som: ["bombox", "jbl", "caixa"],
  caixinha: ["bombox", "caixa"],
  carregador: ["carregadores", "fonte", "adaptador"],
  fone: ["fones", "headphone", "earbuds"],
  cabo: ["cabos"],
  internet: ["starlink"],
  antena: ["starlink"],
};

/** Só letras e números: "NCB-6504" → "ncb6504". */
const compact = (text: string) => text.replace(/[^a-z0-9]/g, "");

export function matchesSearch(product: SearchableProduct, query: string, categoryName = ""): boolean {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = normalizeSearch(
    [product.brand, product.name, product.sku ?? "", categoryName, ...product.store_product_variants.map((v) => v.name)].join(" "),
  );
  const compactHaystack = compact(haystack);
  return terms.every((term) => {
    if (haystack.includes(term)) return true;
    const short = compact(term);
    if (short.length >= 2 && compactHaystack.includes(short)) return true;
    return (ALIASES[term] ?? []).some((alias) => haystack.includes(alias));
  });
}
