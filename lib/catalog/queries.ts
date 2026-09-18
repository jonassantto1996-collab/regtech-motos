import { createClient } from "@/lib/supabase/server";

/**
 * Consultas públicas do catálogo. Usam sempre o client de anon key
 * (lib/supabase/server.ts) — nunca service_role.
 *
 * Todas as consultas filtram explicitamente is_active = true, mesmo a RLS
 * já garantindo isso sozinha nas 4 tabelas envolvidas (products,
 * product_images, product_colors, product_specs). É redundante por
 * intenção: deixa claro no código o que cada consulta espera retornar,
 * sem depender só de lembrar que a RLS está fazendo o trabalho pesado.
 */

export type CatalogProduct = {
  id: string;
  brand: string;
  model: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  availability: string;
  warranty: string;
  pickup_available: boolean;
};

export type CatalogProductImage = {
  id: string;
  storage_path: string;
  display_order: number;
  is_main: boolean;
  alt_text: string | null;
};

export type CatalogProductColor = {
  id: string;
  color: string;
};

export type CatalogProductSpec = {
  id: string;
  spec_key: string;
  spec_value: string;
};

export type CatalogProductListItem = CatalogProduct & {
  product_images: CatalogProductImage[];
};

export type CatalogProductDetail = CatalogProduct & {
  product_images: CatalogProductImage[];
  product_colors: CatalogProductColor[];
  product_specs: CatalogProductSpec[];
};

export type SortOption = "recent" | "price_asc" | "price_desc";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Mais recentes" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
];

export const PAGE_SIZE = 12;

export type ListProductsParams = {
  q?: string;
  brand?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
  page?: number;
};

export type ListProductsResult = {
  products: CatalogProductListItem[];
  totalCount: number;
  page: number;
  totalPages: number;
};

/**
 * Remove caracteres que quebrariam a sintaxe do filtro .or() do PostgREST
 * (vírgula separa condições, parênteses agrupam) e limita o tamanho.
 * Não é proteção contra SQL injection (o PostgREST já é parametrizado por
 * natureza) — é só pra evitar que um termo de busca com "," ou "()" gere
 * uma consulta malformada.
 */
function sanitizeSearchTerm(raw: string): string {
  return raw.trim().slice(0, 100).replace(/[,()]/g, "");
}

/**
 * Lista produtos ativos com busca, filtros, ordenação e paginação.
 * Uma única consulta (sem N+1): produtos + imagem principal embutida via
 * relacionamento do PostgREST, filtrada a is_main = true sem !inner (o que
 * manteria na lista produtos sem nenhuma imagem, com array de imagens
 * vazio — caso real do Shineray/Rum hoje).
 */
export async function listProducts(
  params: ListProductsParams
): Promise<ListProductsResult> {
  const supabase = await createClient();

  const page = Math.max(1, Math.floor(params.page ?? 1));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("products")
    .select(
      `id, brand, model, slug, category, description, price, availability, warranty, pickup_available,
       product_images(id, storage_path, display_order, is_main, alt_text)`,
      { count: "exact" }
    )
    .eq("is_active", true)
    .eq("product_images.is_main", true);

  const term = params.q ? sanitizeSearchTerm(params.q) : "";
  if (term) {
    query = query.or(`brand.ilike.%${term}%,model.ilike.%${term}%`);
  }

  if (params.brand) {
    query = query.eq("brand", params.brand);
  }

  if (params.category) {
    query = query.eq("category", params.category);
  }

  if (typeof params.minPrice === "number" && Number.isFinite(params.minPrice)) {
    query = query.gte("price", params.minPrice);
  }

  if (typeof params.maxPrice === "number" && Number.isFinite(params.maxPrice)) {
    query = query.lte("price", params.maxPrice);
  }

  switch (params.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "recent":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("[catalog] erro em listProducts:", error);
    return { products: [], totalCount: 0, page, totalPages: 0 };
  }

  const products = (data ?? []).map((row) => ({
    ...row,
    price: Number(row.price),
  })) as CatalogProductListItem[];

  const totalCount = count ?? 0;
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / PAGE_SIZE) : 0;

  return { products, totalCount, page, totalPages };
}

/**
 * Busca um produto ativo pelo slug, com cores, specs e imagens embutidas
 * (uma única consulta). Retorna null tanto se o slug não existir quanto se
 * o produto estiver inativo — a RLS já filtra os dois casos da mesma
 * forma, então não há como (nem necessidade de) diferenciar aqui.
 */
export async function getProductBySlug(
  slug: string
): Promise<CatalogProductDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `id, brand, model, slug, category, description, price, availability, warranty, pickup_available,
       product_colors(id, color),
       product_specs(id, spec_key, spec_value),
       product_images(id, storage_path, display_order, is_main, alt_text)`
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .order("display_order", {
      ascending: true,
      referencedTable: "product_images",
    })
    .maybeSingle();

  if (error) {
    console.error("[catalog] erro em getProductBySlug:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return { ...data, price: Number(data.price) } as CatalogProductDetail;
}

/** Marcas distintas entre produtos ativos, para popular o filtro. */
export async function getActiveProductBrands(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("brand")
    .eq("is_active", true)
    .order("brand", { ascending: true });

  if (error || !data) return [];
  return Array.from(new Set(data.map((row) => row.brand)));
}

/** Categorias distintas entre produtos ativos, para popular o filtro. */
export async function getActiveProductCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("category")
    .eq("is_active", true)
    .order("category", { ascending: true });

  if (error || !data) return [];
  return Array.from(new Set(data.map((row) => row.category)));
}

/**
 * Menor e maior preço entre produtos ativos, para os limites do filtro de
 * faixa de preço. Duas consultas simples (sem RPC/agregação SQL).
 */
export async function getActiveProductPriceBounds(): Promise<{
  min: number;
  max: number;
} | null> {
  const supabase = await createClient();

  const [minResult, maxResult] = await Promise.all([
    supabase
      .from("products")
      .select("price")
      .eq("is_active", true)
      .order("price", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("products")
      .select("price")
      .eq("is_active", true)
      .order("price", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!minResult.data || !maxResult.data) return null;

  return {
    min: Number(minResult.data.price),
    max: Number(maxResult.data.price),
  };
}


/** Busca um produto ativo por ID para usos editoriais, como o Hero da Home. */
export async function getActiveProductListItemById(
  id: string
): Promise<CatalogProductListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, brand, model, slug, category, description, price, availability, warranty, pickup_available,
       product_images(id, storage_path, display_order, is_main, alt_text)`
    )
    .eq("id", id)
    .eq("is_active", true)
    .eq("product_images.is_main", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as CatalogProductListItem;
}
