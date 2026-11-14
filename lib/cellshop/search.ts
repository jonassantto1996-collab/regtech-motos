/**
 * Busca da vitrine da Regtech Cell Shop (sem dependência de servidor: roda no
 * navegador enquanto o cliente digita).
 *
 * - Sem acento e sem diferenciar maiúsculas ("iphone" acha "iPhone").
 * - Procura na marca, no nome, nas versões e na categoria do produto.
 * - Todas as palavras precisam aparecer ("galaxy a17" não traz o A07).
 * - Referência com ou sem traço/espaço: "6504", "ncb6504" e "NCB-6504" acham o
 *   mesmo produto (também procura no código interno, quando houver).
 * - Referência digitada pela metade: "FN-18" acha o "FN-A18" (mesmas letras
 *   iniciais, mesmo número; a letra do meio pode faltar). Não confunde com FN-B31.
 * - Alguns apelidos comuns: "apple" acha iPhone e iPad; "tablet" acha iPad;
 *   "celular" acha smartphones e iPhone; "caixa de som" e "bombox" acham as caixas JBL.
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
  som: ["bombox", "boombox", "jbl", "caixa"],
  caixinha: ["bombox", "boombox", "caixa"],
  // A categoria agora se chama "Boombox e caixas JBL"; quem digita "bombox" continua achando.
  bombox: ["boombox", "jbl", "caixa"],
  carregador: ["carregadores", "fonte", "adaptador"],
  fone: ["fones", "headphone", "earbuds"],
  cabo: ["cabos"],
  internet: ["starlink"],
  antena: ["starlink"],
};

/** Palavras de ligação que a busca ignora quando há outras palavras. */
const FILLER = new Set(["de", "da", "do", "das", "dos", "e", "para", "pra", "com", "em"]);

/** Só letras e números: "NCB-6504" → "ncb6504". */
const compact = (text: string) => text.replace(/[^a-z0-9]/g, "");
const digitsOf = (text: string) => text.replace(/[^0-9]/g, "");
const lettersOf = (text: string) => text.replace(/[^a-z]/g, "");

/** As letras de `small` aparecem em `big`, na mesma ordem (pode pular letras). */
function inOrder(small: string, big: string): boolean {
  let i = 0;
  for (const ch of big) if (ch === small[i]) i++;
  return i === small.length;
}

/**
 * Referência digitada incompleta ("fn18" para "FN-A18"): mesma primeira letra,
 * exatamente o mesmo número e as letras digitadas aparecendo na ordem.
 */
function matchesReference(term: string, words: string[]): boolean {
  const ref = compact(term);
  const digits = digitsOf(ref);
  const letters = lettersOf(ref);
  if (ref.length < 3 || !digits || !letters) return false;
  return words.some((word) => {
    const w = compact(word);
    return w[0] === ref[0] && digitsOf(w) === digits && inOrder(letters, lettersOf(w));
  });
}

export function matchesSearch(product: SearchableProduct, query: string, categoryName = ""): boolean {
  const all = normalizeSearch(query).split(/\s+/).filter(Boolean);
  // "caixa de som", "capa para iphone": palavras de ligação não precisam aparecer no produto.
  const terms = all.some((t) => !FILLER.has(t)) ? all.filter((t) => !FILLER.has(t)) : all;
  if (!terms.length) return true;
  const haystack = normalizeSearch(
    [product.brand, product.name, product.sku ?? "", categoryName, ...product.store_product_variants.map((v) => v.name)].join(" "),
  );
  const compactHaystack = compact(haystack);
  const words = haystack.split(/\s+/);
  return terms.every((term) => {
    if (haystack.includes(term)) return true;
    const short = compact(term);
    if (short.length >= 2 && compactHaystack.includes(short)) return true;
    if (matchesReference(term, words)) return true;
    return (ALIASES[term] ?? []).some((alias) => haystack.includes(alias));
  });
}
