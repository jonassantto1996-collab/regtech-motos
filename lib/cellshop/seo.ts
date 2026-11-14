/**
 * Busca no Google da Regtech Cell Shop (loja em Tucumã, PA).
 *
 * - Uma página por categoria, com endereço próprio e o nome da cidade no título
 *   (ex.: regtechcellshop.com.br/boombox-jbl → "JBL Boombox e caixas de som em Tucumã-PA").
 * - Horário da loja, igual ao do perfil da loja no Google.
 */
export type CategoryPage = {
  /** Endereço da página: regtechcellshop.com.br/<path>. */
  path: string;
  /** Título no Google (o site completa com "| Regtech Cell Shop"). */
  title: string;
  h1: string;
  description: string;
  /** O que a loja tem nessa categoria, em uma frase. */
  lead: string;
};

/** Categorias do painel (pelo slug) → página. Categoria nova sem entrada aqui usa o próprio nome. */
const PAGES: Record<string, Omit<CategoryPage, "description"> & { description?: string }> = {
  iphone: { path: "iphone", title: "iPhone em Tucumã-PA", h1: "iPhone em Tucumã, PA", lead: "iPhone novo e seminovo" },
  ipad: { path: "ipad-e-tablets", title: "iPad e tablets em Tucumã-PA", h1: "iPad e tablets em Tucumã, PA", lead: "iPad e tablets" },
  smartphones: {
    path: "celulares",
    title: "Celulares e smartphones em Tucumã-PA",
    h1: "Celulares e smartphones em Tucumã, PA",
    lead: "celulares Samsung, Xiaomi, Motorola e outras marcas",
  },
  relogios: { path: "relogios-smartwatch", title: "Relógios e smartwatches em Tucumã-PA", h1: "Relógios e smartwatches em Tucumã, PA", lead: "smartwatches e relógios inteligentes" },
  carregadores: { path: "carregadores", title: "Carregadores e cabos em Tucumã-PA", h1: "Carregadores e cabos em Tucumã, PA", lead: "carregadores, cabos e fontes" },
  bombox: {
    path: "boombox-jbl",
    title: "JBL Boombox e caixas de som em Tucumã-PA",
    h1: "JBL Boombox e caixas de som em Tucumã, PA",
    lead: "caixas de som JBL, como Boombox, PartyBox, Flip e Go",
  },
  starlink: { path: "starlink", title: "Starlink em Tucumã-PA", h1: "Starlink em Tucumã, PA", lead: "kits e acessórios Starlink para internet via satélite" },
  "drones-e-cameras": { path: "drones-e-cameras", title: "Drones e câmeras em Tucumã-PA", h1: "Drones e câmeras em Tucumã, PA", lead: "drones e câmeras" },
  games: { path: "games", title: "Games e controles em Tucumã-PA", h1: "Games e controles em Tucumã, PA", lead: "games, controles e acessórios para jogar" },
  acessorios: { path: "acessorios", title: "Acessórios para celular em Tucumã-PA", h1: "Acessórios para celular em Tucumã, PA", lead: "fones, capinhas, películas e outros acessórios" },
};

/** Endereços que já são outras páginas da loja e não podem virar categoria. */
const RESERVED = new Set(["produto", "lojista", "tabela", "admin", "api", "cellshop", "sitemap.xml", "robots.txt"]);

function fallbackPath(slug: string): string {
  return RESERVED.has(slug) ? `categoria-${slug}` : slug;
}

export function categoryPage(category: { slug: string; name: string }): CategoryPage {
  const known = PAGES[category.slug];
  const page = known ?? {
    path: fallbackPath(category.slug),
    title: `${category.name} em Tucumã-PA`,
    h1: `${category.name} em Tucumã, PA`,
    lead: category.name.toLowerCase(),
  };
  return {
    ...page,
    description:
      page.description ??
      `${capitalize(page.lead)} na Regtech Cell Shop, no Centro de Tucumã-PA. Veja os modelos, simule as parcelas e compre pelo WhatsApp.`,
  };
}

/** /boombox-jbl → categoria Bombox (ou null se o endereço não é de categoria). */
export function categoryFromPath<T extends { slug: string; name: string }>(path: string, categories: T[]): T | null {
  const clean = decodeURIComponent(path).toLowerCase();
  return categories.find((c) => categoryPage(c).path === clean) ?? null;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Horário da loja (o mesmo do perfil no Google). Mudou o horário? Troque aqui
 * e no Perfil da Empresa no Google, sempre os dois juntos.
 */
export const CELLSHOP_HOURS = [
  { label: "Segunda a sexta", hours: "07:30 – 18:00", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "07:30", closes: "18:00" },
  { label: "Sábado", hours: "07:30 – 13:00", days: ["Saturday"], opens: "07:30", closes: "13:00" },
  { label: "Domingo", hours: "Fechado", days: [] as string[], opens: null, closes: null },
] as const;
