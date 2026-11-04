/**
 * Lista de produtos para o grupo de lojistas no WhatsApp (painel → Loja →
 * "Lista para WhatsApp"). Sem dependência de servidor: monta o texto no navegador.
 *
 * Regras de preço (as mesmas da loja):
 * - preço vazio ou zero = "Consulte o valor";
 * - a versão com preço de atacado próprio usa o dela (zero = consulte);
 *   versão sem preço próprio usa o atacado do produto.
 */
export type ListMoney = number | string | null | undefined;

export type WhatsAppListItem = {
  id: string;
  brand: string;
  name: string;
  slug: string;
  category: string;
  /** Menor preço de atacado (null = consulte o valor). */
  price: number | null;
  /** Versões com preços diferentes: mostra "a partir de". */
  from: boolean;
  wholesaleOnly: boolean;
};

export type WhatsAppListOptions = {
  baseUrl: string;
  includePrices: boolean;
  includeLinks: boolean;
  /** Data mostrada no topo (ex.: "03/11/2026"). */
  date: string;
};

function positive(value: ListMoney): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Menor preço de atacado do produto, considerando as versões ativas. */
export function wholesaleSummary(
  productWholesale: ListMoney,
  variants: { wholesale_price: ListMoney }[],
): { price: number | null; from: boolean } {
  const prices = (variants.length ? variants.map((v) => {
    const own = v.wholesale_price;
    return own !== null && own !== undefined && own !== "" ? positive(own) : positive(productWholesale);
  }) : [positive(productWholesale)]).filter((p): p is number => p !== null);
  if (!prices.length) return { price: null, from: false };
  return { price: Math.min(...prices), from: new Set(prices).size > 1 };
}

/** "R$ 1.299,00" com espaço comum (o WhatsApp mostra igual em todo celular). */
export function brl(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value).replace(/\s/g, " ");
}

/** Nome sem repetir a marca ("Xiaomi" + "Xiaomi Redmi" vira "Xiaomi Redmi"). */
export function displayName(item: Pick<WhatsAppListItem, "brand" | "name">): string {
  const brand = item.brand.trim();
  const name = item.name.trim();
  return name.toLowerCase().startsWith(brand.toLowerCase()) ? name : `${brand} ${name}`.trim();
}

function priceText(item: WhatsAppListItem): string {
  if (item.price === null) return "consulte o valor";
  return `${item.from ? "a partir de " : ""}*${brl(item.price)}*`;
}

/** Texto pronto para colar no grupo (negrito do WhatsApp com *asteriscos*). */
export function buildWhatsAppList(items: WhatsAppListItem[], options: WhatsAppListOptions): string {
  const base = options.baseUrl.replace(/\/+$/, "");
  const lines: string[] = [
    "*REGTECH CELL SHOP · ATACADO*",
    `Lista para lojistas · ${options.date}`,
  ];

  // Agrupa por categoria, na ordem em que os itens chegam (a ordem do painel).
  const groups = new Map<string, WhatsAppListItem[]>();
  for (const item of items) {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }

  for (const [category, list] of groups) {
    lines.push("", `*${category.toUpperCase()}*`);
    for (const item of list) {
      const name = displayName(item);
      lines.push(options.includePrices ? `• ${name}: ${priceText(item)}` : `• ${name}`);
      if (options.includeLinks) lines.push(`${base}/produto/${item.slug}`);
    }
  }

  lines.push(
    "",
    options.includePrices
      ? "Preços exclusivos para lojistas cadastrados. Para ver todos os produtos e fazer o pedido, entre na Área do Lojista:"
      : "Os preços de atacado aparecem para lojistas cadastrados. Entre na Área do Lojista:",
    `${base}/lojista`,
    "",
    "Ainda não tem cadastro? É rápido:",
    `${base}/lojista/cadastro`,
  );
  return lines.join("\n");
}

function cell(value: string | number): string {
  let text = String(value);
  // Evita que a planilha interprete o texto como fórmula.
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Planilha (CSV para Excel em português) dos produtos da lista. */
export function buildWhatsAppListCsv(items: WhatsAppListItem[], baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const rows = [["Categoria", "Produto", "Preço atacado", "A partir de", "Só atacado", "Link"].join(";")];
  for (const item of items) {
    rows.push(
      [
        cell(item.category),
        cell(displayName(item)),
        item.price === null ? "Consulte" : item.price.toFixed(2).replace(".", ","),
        item.from ? "Sim" : "Não",
        item.wholesaleOnly ? "Sim" : "Não",
        cell(`${base}/produto/${item.slug}`),
      ].join(";"),
    );
  }
  return "﻿" + rows.join("\r\n");
}
