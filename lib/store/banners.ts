/**
 * Banners do topo da Regtech Cell Shop. Cada banner tem uma imagem por tela
 * (computador, tablet e celular). Aqui fica a parte "inteligente" do envio:
 * descobrir de qual tela é cada arquivo, juntar as 3 versões do mesmo banner
 * e sugerir o link (a categoria) pelo nome do arquivo.
 */
import { normalizeFileBase } from "./batch-photos.ts";

export const MAX_BANNERS = 12;

export type BannerDevice = "desktop" | "tablet" | "mobile";
export const BANNER_DEVICES: BannerDevice[] = ["desktop", "tablet", "mobile"];
export const DEVICE_LABEL: Record<BannerDevice, string> = { desktop: "Computador", tablet: "Tablet", mobile: "Celular" };

/** Telas em que cada versão aparece (larguras em px, iguais ao site). */
export const DEVICE_RANGE: Record<BannerDevice, string> = {
  desktop: "a partir de 1024 px",
  tablet: "de 640 a 1023 px",
  mobile: "até 639 px",
};

// Palavras que dizem a tela com certeza ("iphone-desktop.jpg").
const DEVICE_WORDS: Record<BannerDevice, string[]> = {
  desktop: ["desktop", "computador", "notebook", "pc"],
  tablet: ["tablet"],
  mobile: ["mobile", "celular", "movel"],
};

// Palavras que também podem ser nome de produto ("smartphone", "phone"): só
// valem como tela quando o arquivo não tem nenhuma das palavras acima.
const WEAK_DEVICE_WORDS: Record<BannerDevice, string[]> = {
  desktop: ["web", "wide"],
  tablet: ["tab"],
  mobile: ["mobi", "mob", "cel", "phone", "smartphone"],
};

const NOISE_WORDS = new Set(["banner", "banners", "hero", "slide", "slides", "img", "imagem", "image", "versao", "final", "copia", "copy", "de", "do", "da"]);

function tokens(text: string): string[] {
  return normalizeFileBase(text).split("-").filter(Boolean);
}

function deviceOfToken(token: string, words: Record<BannerDevice, string[]> = DEVICE_WORDS): BannerDevice | null {
  for (const device of BANNER_DEVICES) if (words[device].includes(token)) return device;
  return null;
}

/** Procura a tela nas partes do caminho, do nome do arquivo para as pastas. */
function findDevice(parts: string[], words: Record<BannerDevice, string[]>): BannerDevice | null {
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    for (const token of tokens(parts[i])) {
      const device = deviceOfToken(token, words);
      if (device) return device;
    }
  }
  return null;
}

/** Proporção quando o nome não diz a tela: largo = computador, em pé = celular. */
export function deviceFromSize(width: number, height: number): BannerDevice {
  const ratio = width / height;
  if (ratio >= 1.6) return "desktop";
  if (ratio < 0.9) return "mobile";
  return "tablet";
}

/**
 * Tela do arquivo: primeiro pelo nome ("iphone-mobile.jpg"), depois pelas
 * pastas ("celular/iphone.jpg"), por último pela proporção da imagem.
 */
export function detectDevice(path: string, width: number, height: number): BannerDevice {
  const parts = path.split("/").filter(Boolean);
  return findDevice(parts, DEVICE_WORDS) ?? findDevice(parts, WEAK_DEVICE_WORDS) ?? deviceFromSize(width, height);
}

/**
 * Nome que junta as 3 versões do mesmo banner: tira a tela, palavras como
 * "banner" e medidas ("1920x700"). "Banner iPhone - Mobile 1080x1350.jpg" e
 * "banner-iphone-desktop.png" viram "iphone".
 */
export function bannerKey(path: string, commonPrefix: string[] = []): string {
  const parts = path.split("/").filter(Boolean);
  const kept = parts.slice(commonPrefix.length);
  // Palavra fraca ("smartphone") só sai do nome quando foi ela que disse a tela.
  const strong = findDevice(parts, DEVICE_WORDS) !== null;
  const words: string[] = [];
  for (const part of kept) {
    // "iphone-mobile (1).jpg" é cópia do mesmo arquivo, não outro banner.
    for (const token of tokens(part.replace(/\s*\(\d+\)(?=\.[^.]+$|$)/, ""))) {
      if (deviceOfToken(token) || (!strong && deviceOfToken(token, WEAK_DEVICE_WORDS))) continue;
      if (NOISE_WORDS.has(token) || /^\d+x\d+$/.test(token)) continue;
      words.push(token);
    }
  }
  return words.join("-");
}

/** Pastas que todos os arquivos têm em comum (ex.: "banners/"), para não entrarem no nome. */
export function commonFolders(paths: string[]): string[] {
  const folders = paths.map((p) => p.split("/").filter(Boolean).slice(0, -1));
  if (!folders.length) return [];
  const first = folders[0];
  let size = 0;
  while (size < first.length && folders.every((f) => f[size] === first[size])) size += 1;
  return first.slice(0, size);
}

export type BannerCategory = { slug: string; name: string };

const CATEGORY_HINTS: Record<string, string[]> = {
  iphone: ["iphone", "apple"],
  ipad: ["ipad", "tablet", "tablets", "pad"],
  smartphones: ["smartphone", "smartphones", "samsung", "galaxy", "xiaomi", "redmi", "poco", "motorola", "moto", "realme", "android", "celulares"],
  carregadores: ["carregador", "carregadores", "fonte", "cabo", "cabos", "powerbank", "bank"],
  bombox: ["bombox", "boombox", "jbl", "partybox", "caixa", "caixas", "som", "flip", "go"],
  starlink: ["starlink", "internet", "antena"],
  acessorios: ["acessorio", "acessorios", "fone", "fones", "capinha", "capa", "pelicula", "tune"],
};

export function categoryLink(slug: string): string {
  return `?categoria=${encodeURIComponent(slug)}#vitrine`;
}

/** Sugere a categoria pelo nome do banner ("iphone-17" -> iPhone). */
export function guessCategory(key: string, categories: BannerCategory[]): BannerCategory | null {
  const words = new Set(key.split("-"));
  for (const category of categories) {
    if (words.has(category.slug) || tokens(category.name).every((t) => words.has(t))) return category;
  }
  for (const category of categories) {
    if ((CATEGORY_HINTS[category.slug] ?? []).some((hint) => words.has(hint))) return category;
  }
  return null;
}

/** "iphone-17-pro" -> "Iphone 17 pro" (o título pode ser editado na tela). */
export function titleFromKey(key: string): string {
  const text = key.replace(/-/g, " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

export type BannerFile<F> = { file: F; path: string; width: number; height: number };

export type BannerGroup<F> = {
  key: string;
  title: string;
  link: string;
  versions: Partial<Record<BannerDevice, BannerFile<F>>>;
  /** Arquivos repetidos para a mesma tela (só o primeiro entra). */
  extra: BannerFile<F>[];
};

export function planBanners<F>(files: BannerFile<F>[], categories: BannerCategory[]): BannerGroup<F>[] {
  const prefix = commonFolders(files.map((f) => f.path));
  const groups = new Map<string, BannerGroup<F>>();
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path, "pt-BR", { numeric: true }));
  for (const item of sorted) {
    const key = bannerKey(item.path, prefix) || "banner";
    let group = groups.get(key);
    if (!group) {
      const category = guessCategory(key, categories);
      group = { key, title: category?.name ?? titleFromKey(key), link: category ? categoryLink(category.slug) : "", versions: {}, extra: [] };
      groups.set(key, group);
    }
    const device = detectDevice(item.path, item.width, item.height);
    if (group.versions[device]) group.extra.push(item);
    else group.versions[device] = item;
  }
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key, "pt-BR", { numeric: true }));
}

/**
 * Aceita só links seguros: dentro da loja ("?categoria=iphone#vitrine",
 * "/produto/x", "#vitrine") ou endereço https. Devolve null se for inválido.
 */
export function normalizeBannerLink(input: string | null | undefined): string | null {
  const link = (input ?? "").trim();
  if (!link) return null;
  if (link.length > 300 || /[\s<>"'`\\]/.test(link)) return null;
  if (/^[?#]/.test(link)) return link;
  if (link.startsWith("/") && !link.startsWith("//")) return link;
  try {
    const url = new URL(link);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Endereço final do banner no site (links "?…" e "#…" são da página inicial da loja). */
export function bannerHref(link: string | null, home: string): string | null {
  if (!link) return null;
  if (/^[?#]/.test(link)) return `${home === "/" ? "/" : home}${link}`;
  if (link.startsWith("/") && home !== "/" && !link.startsWith(home)) return `${home}${link}`;
  return link;
}

/** Proporção mais comum entre os banners para uma tela (a caixa do carrossel usa ela). */
export function commonRatio(sizes: { width: number | null; height: number | null }[]): number | null {
  const counts = new Map<string, { ratio: number; n: number }>();
  for (const s of sizes) {
    if (!s.width || !s.height) continue;
    const ratio = Math.round((s.width / s.height) * 100) / 100;
    const k = ratio.toFixed(2);
    counts.set(k, { ratio, n: (counts.get(k)?.n ?? 0) + 1 });
  }
  let best: { ratio: number; n: number } | null = null;
  for (const c of counts.values()) if (!best || c.n > best.n) best = c;
  return best?.ratio ?? null;
}
