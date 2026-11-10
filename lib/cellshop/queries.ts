import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hidesRetailPrices, stripRetailPrices, type PriceMode } from "@/lib/cellshop/pricing";
import type { ResellerStatus } from "@/lib/store/resellers";

/**
 * Leitura pública da Regtech Cell Shop. Usa a chave pública (anon): as regras
 * do banco (RLS) só liberam produtos ativos, suas fotos, ficha e versões ativas.
 * O preço de atacado NÃO é público: só é buscado pelo servidor, e só para
 * lojistas aprovados (ver getCellshopViewer e withWholesalePrices).
 */
export type CellshopCategory = { id: string; name: string; slug: string };

export type CellshopImage = { id: string; storage_path: string; alt_text: string | null; display_order: number; color?: string | null };

export type CellshopVariant = {
  id: string;
  name: string;
  price: number | string | null;
  wholesale_price: number | string | null;
  stock_quantity: number;
};

export type CellshopProduct = {
  id: string;
  slug: string;
  brand: string;
  name: string;
  description: string;
  price: number | string | null;
  wholesale_price: number | string | null;
  card_price: number | string | null;
  card_installments: number | null;
  warranty: string;
  availability: string;
  category_id: string;
  created_at: string;
  store_product_images: CellshopImage[];
  store_product_variants: CellshopVariant[];
  /** Condição especial de atacado (só para lojistas aprovados). */
  wholesale_note?: string | null;
  /** Produto "só atacado": fora do site público, só lojista aprovado vê. */
  wholesale_only?: boolean;
};

export type CellshopProductDetail = CellshopProduct & {
  store_product_specs: { id: string; spec_key: string; spec_value: string; display_order: number }[];
};

const PRODUCT_FIELDS =
  "id,slug,brand,name,description,price,card_price,card_installments,warranty,availability,category_id,created_at," +
  "store_product_images(id,storage_path,alt_text,display_order,color)," +
  "store_product_variants(id,name,price,stock_quantity)";

function sortProduct<T extends CellshopProduct>(product: T, hidePrices = false): T {
  const base = hidePrices ? stripRetailPrices(product) : product;
  return {
    ...base,
    // Sem o atacado por padrão: só lojista aprovado recebe esses valores.
    wholesale_price: null,
    wholesale_note: null,
    store_product_variants: (base.store_product_variants ?? []).map((v) => ({ ...v, wholesale_price: null })),
    store_product_images: [...(product.store_product_images ?? [])].sort((a, b) => a.display_order - b.display_order),
  };
}

export type CellshopViewer = {
  id: string;
  store_name: string;
  contact_name: string;
  status: ResellerStatus;
};

/** Lojista logado (ou null para o cliente final). O lojista só lê o próprio cadastro (RLS). */
export const getCellshopViewer = cache(async (): Promise<CellshopViewer | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (!userId) return null;
  const { data: reseller } = await supabase
    .from("store_resellers")
    .select("id,store_name,contact_name,status")
    .eq("user_id", userId)
    .maybeSingle();
  return (reseller as CellshopViewer | null) ?? null;
});

/** Cliente final vê varejo; lojista aprovado vê atacado. */
export const getPriceMode = cache(async (): Promise<PriceMode> => {
  const viewer = await getCellshopViewer();
  return viewer?.status === "approved" ? "wholesale" : "retail";
});

/** Chave "Preços no site" da loja (painel). Sem a coluna ou com erro, mostra os preços. */
export const getStoreShowPrices = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("catalog_settings").select("store_show_prices").eq("id", true).maybeSingle();
  if (error || !data) return true;
  return (data as { store_show_prices?: boolean }).store_show_prices !== false;
});

/** O visitante (cliente final) deve ver "Consulte o valor" no lugar dos preços? */
export const getHideRetailPrices = cache(async (): Promise<boolean> => {
  const [mode, show] = await Promise.all([getPriceMode(), getStoreShowPrices()]);
  return hidesRetailPrices(mode, show);
});

/**
 * Coloca os preços de atacado nos produtos. Chamar só depois de confirmar que
 * o visitante é lojista aprovado (getPriceMode() === "wholesale").
 */
export async function withWholesalePrices<T extends CellshopProduct>(products: T[]): Promise<T[]> {
  if (!products.length) return products;
  const ids = products.map((p) => p.id);
  const admin = createAdminClient();
  const [{ data: rows }, { data: variants }] = await Promise.all([
    admin.from("store_products").select("id,wholesale_price,wholesale_note").in("id", ids),
    admin.from("store_product_variants").select("id,wholesale_price").in("product_id", ids),
  ]);
  const byProduct = new Map((rows ?? []).map((r) => [r.id as string, r]));
  const byVariant = new Map((variants ?? []).map((v) => [v.id as string, v.wholesale_price as number | string | null]));
  return products.map((p) => ({
    ...p,
    wholesale_price: (byProduct.get(p.id)?.wholesale_price as number | string | null) ?? null,
    wholesale_note: (byProduct.get(p.id)?.wholesale_note as string | null) ?? null,
    store_product_variants: p.store_product_variants.map((v) => ({ ...v, wholesale_price: byVariant.get(v.id) ?? null })),
  }));
}

export const getCellshopCategories = cache(async (): Promise<CellshopCategory[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_categories")
    .select("id,name,slug")
    .eq("is_active", true)
    .order("sort_order");
  if (error) console.error("[cellshop] categorias:", error);
  return data ?? [];
});

/**
 * Produtos "só atacado" (fora do site público). As regras do banco escondem
 * esses produtos da chave pública; o servidor só os busca com a chave de
 * serviço depois de confirmar que o visitante é lojista aprovado.
 */
async function getWholesaleOnlyProducts(slug?: string): Promise<CellshopProductDetail[]> {
  if ((await getPriceMode()) !== "wholesale") return [];
  let query = createAdminClient()
    .from("store_products")
    .select(PRODUCT_FIELDS + ",store_product_specs(id,spec_key,spec_value,display_order)")
    .eq("is_active", true)
    .eq("wholesale_only", true)
    // Com a chave de serviço, as versões desativadas precisam ser filtradas aqui.
    .eq("store_product_variants.is_active", true);
  if (slug) query = query.eq("slug", slug);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(500);
  if (error) console.error("[cellshop] produtos só atacado:", error);
  return ((data ?? []) as unknown as CellshopProductDetail[]).map((p) => ({ ...sortProduct(p), wholesale_only: true }));
}

/** O endereço é de um produto "só atacado" ativo? (Para mandar o visitante à Área do Lojista.) */
export async function isWholesaleOnlySlug(slug: string): Promise<boolean> {
  if (!/^[a-z0-9-]{1,180}$/.test(slug)) return false;
  const { data } = await createAdminClient()
    .from("store_products")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .eq("wholesale_only", true)
    .maybeSingle();
  return Boolean(data);
}

export async function getCellshopProducts(): Promise<CellshopProduct[]> {
  const supabase = await createClient();
  const mode = await getPriceMode();
  let query = supabase.from("store_products").select(PRODUCT_FIELDS).eq("is_active", true);
  // Produto "só varejo" não aparece para o lojista aprovado.
  if (mode === "wholesale") query = query.eq("retail_only", false);
  const [{ data, error }, wholesaleOnly, hidePrices] = await Promise.all([
    query.order("created_at", { ascending: false }).limit(500),
    getWholesaleOnlyProducts(),
    getHideRetailPrices(),
  ]);
  if (error) console.error("[cellshop] produtos:", error);
  const publicList = ((data ?? []) as unknown as CellshopProduct[]).map((p) => sortProduct(p, hidePrices));
  const list = [...publicList, ...wholesaleOnly].sort(
    (a, b) => b.created_at.localeCompare(a.created_at),
  );
  // Produtos com foto aparecem primeiro na vitrine (dentro de cada grupo, os mais novos primeiro).
  const hasPhoto = (p: CellshopProduct) => (p.store_product_images.length > 0 ? 1 : 0);
  return list.sort((a, b) => hasPhoto(b) - hasPhoto(a));
}

export async function getCellshopProduct(slug: string): Promise<CellshopProductDetail | null> {
  const supabase = await createClient();
  let query = supabase
    .from("store_products")
    .select(PRODUCT_FIELDS + ",store_product_specs(id,spec_key,spec_value,display_order)")
    .eq("slug", slug)
    .eq("is_active", true);
  // O link de um produto "só varejo" não abre para o lojista aprovado.
  if ((await getPriceMode()) === "wholesale") query = query.eq("retail_only", false);
  const { data, error } = await query.maybeSingle();
  if (error) console.error("[cellshop] produto:", error);
  // Fora do site público: só o lojista aprovado encontra o produto "só atacado".
  const product = data
    ? sortProduct(data as unknown as CellshopProductDetail, await getHideRetailPrices())
    : (await getWholesaleOnlyProducts(slug))[0];
  if (!product) return null;
  return {
    ...product,
    store_product_specs: [...(product.store_product_specs ?? [])].sort((a, b) => a.display_order - b.display_order),
  };
}

/** Busca da vitrine: ver lib/cellshop/search.ts (roda também no navegador). */
export { matchesSearch } from "@/lib/cellshop/search";

export type CellshopBanner = {
  id: string;
  title: string;
  link_url: string | null;
  desktop_path: string;
  desktop_width: number | null;
  desktop_height: number | null;
  tablet_path: string | null;
  tablet_width: number | null;
  tablet_height: number | null;
  mobile_path: string | null;
  mobile_width: number | null;
  mobile_height: number | null;
};

/** Banners ativos do topo da loja, na ordem do painel. */
export const getCellshopBanners = cache(async (): Promise<CellshopBanner[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_banners")
    .select("id,title,link_url,desktop_path,desktop_width,desktop_height,tablet_path,tablet_width,tablet_height,mobile_path,mobile_width,mobile_height")
    .eq("is_active", true)
    .order("display_order")
    .order("created_at")
    .limit(12);
  // Sem banners (ou tabela ainda não criada): o topo mostra só o texto da loja.
  if (error) return [];
  return (data ?? []) as CellshopBanner[];
});
