/**
 * Tabela de atacado do vendedor (Regtech Cell Shop).
 *
 * Página para o celular, aberta por um link secreto (sem login), com os produtos
 * que têm preço de atacado, separados por categoria. Os preços vêm do banco na
 * hora, então a tabela sempre bate com o painel. Produto sem preço de atacado
 * não aparece.
 */
import { toNumber, variantPrice, type Money } from "./pricing.ts";

/** Link secreto: 40 a 64 letras minúsculas e números (o painel gera 64). */
const TOKEN = /^[a-z0-9]{40,64}$/;

export function isPriceTableToken(value: unknown): value is string {
  return typeof value === "string" && TOKEN.test(value);
}

export type PriceTableProduct = {
  id: string;
  brand: string;
  name: string;
  category_id: string;
  wholesale_price: Money;
  wholesale_note: string | null;
  store_product_images: { storage_path: string; display_order: number }[] | null;
  store_product_variants: { id: string; name: string; wholesale_price: Money; is_active: boolean | null }[] | null;
};

export type PriceLine = { label: string | null; price: number };

export type PriceItem = {
  id: string;
  brand: string;
  name: string;
  photo: string | null;
  lines: PriceLine[];
  note: string | null;
  /** Texto sem acento e em minúsculas, para a busca. */
  search: string;
};

export type PriceSection = { id: string; name: string; items: PriceItem[] };

/** "Carregador Turbo 20W" -> "carregador turbo 20w" (sem acento, espaços simples). */
export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const GENERIC_VARIANT = new Set(["unico", "unica", "padrao"]);

/**
 * Nome de um grupo de versões com o mesmo preço:
 * ["Preto", "Branco"] -> "Preto, Branco"; ["256 GB · Prata", "256 GB · Preto"] -> "256 GB · Prata, Preto".
 */
export function groupLabel(names: string[]): string | null {
  // "Único" / "Padrão" é a versão padrão do cadastro: não ajuda o vendedor, fica de fora.
  names = names.filter((n) => !GENERIC_VARIANT.has(normalizeSearch(n)));
  if (names.length === 0) return null;
  if (names.length === 1) return names[0];
  const parts = names.map((n) => n.split(" · "));
  const head = parts[0][0];
  if (parts.every((p) => p.length > 1 && p[0] === head)) return `${head} · ${parts.map((p) => p.slice(1).join(" · ")).join(", ")}`;
  return names.join(", ");
}

/**
 * Preços de atacado do produto, por versão.
 * - Sem versões: o preço do produto.
 * - Versões com o mesmo preço (ex.: cores) ficam numa linha só, com os nomes juntos.
 * - Preços diferentes (ex.: 128 GB / 256 GB): uma linha por preço, do menor para o maior.
 * - Se todas as versões custam o mesmo, a linha não leva nome (só aparece embaixo, em letra pequena).
 * - Versão inativa ou com preço zero ("Consulte") fica de fora.
 */
export function priceLines(product: PriceTableProduct): PriceLine[] {
  const variants = (product.store_product_variants ?? []).filter((v) => v.is_active !== false);
  const base = { price: null, wholesale_price: product.wholesale_price, card_price: null, card_installments: null };
  if (variants.length === 0) {
    const price = toNumber(product.wholesale_price);
    return price ? [{ label: null, price }] : [];
  }
  const groups = new Map<number, string[]>();
  for (const v of variants) {
    const price = variantPrice(base, { price: null, wholesale_price: v.wholesale_price }, "wholesale");
    if (price === null) continue;
    const names = groups.get(price) ?? [];
    if (v.name.trim()) names.push(v.name.trim());
    groups.set(price, names);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([price, names]) => ({ label: groupLabel(names), price }));
}

const byName = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });

/** Monta as abas (categorias na ordem do painel) só com produtos que têm preço de atacado. */
export function buildPriceTable(categories: { id: string; name: string }[], products: PriceTableProduct[]): PriceSection[] {
  return categories
    .map((category) => {
      const items = products
        .filter((p) => p.category_id === category.id)
        .map((p): PriceItem | null => {
          const lines = priceLines(p);
          if (lines.length === 0) return null;
          const photo = [...(p.store_product_images ?? [])].sort((a, b) => a.display_order - b.display_order)[0]?.storage_path ?? null;
          const note = p.wholesale_note?.trim() || null;
          return {
            id: p.id,
            brand: p.brand,
            name: p.name,
            photo,
            lines,
            note,
            search: normalizeSearch([p.brand, p.name, category.name, ...lines.map((l) => l.label ?? "")].join(" ")),
          };
        })
        .filter((item): item is PriceItem => item !== null)
        .sort((a, b) => byName.compare(a.name, b.name));
      return { id: category.id, name: category.name, items };
    })
    .filter((section) => section.items.length > 0);
}

/** Busca: todas as palavras digitadas precisam aparecer (em qualquer ordem, sem acento). */
export function filterPriceTable(sections: PriceSection[], query: string): PriceSection[] {
  const words = normalizeSearch(query).split(" ").filter(Boolean);
  if (words.length === 0) return sections;
  return sections
    .map((s) => ({ ...s, items: s.items.filter((item) => words.every((w) => item.search.includes(w))) }))
    .filter((s) => s.items.length > 0);
}
