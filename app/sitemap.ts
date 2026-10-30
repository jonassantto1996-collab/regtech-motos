import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { CELLSHOP_URL, isCellshopHost } from "@/lib/cellshop/config";

// Sem essa diretiva, o Next.js poderia gerar o sitemap de forma estática
// no build — refletindo os produtos só até o próximo deploy, e não em
// tempo real. Mantém a mesma decisão de "sem cache" aplicada às páginas do
// catálogo (Decisão 6).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // No domínio da Regtech Cell Shop, o sitemap lista a vitrine e os produtos da loja.
  if (await isCellshopHost()) return cellshopSitemap();

  const siteUrl = getSiteUrl();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("is_active", true);

  if (error) {
    console.error("[catalog] erro em sitemap:", error);
    return [{ url: `${siteUrl}/` }, { url: `${siteUrl}/loja` }, { url: `${siteUrl}/products` }];
  }

  const productEntries: MetadataRoute.Sitemap = (data ?? []).map((p) => ({
    url: `${siteUrl}/products/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
  }));

  return [{ url: `${siteUrl}/` }, { url: `${siteUrl}/loja` }, { url: `${siteUrl}/products` }, ...productEntries];
}

async function cellshopSitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_products")
    .select("slug, updated_at")
    .eq("is_active", true)
    .limit(1000);

  if (error) console.error("[cellshop] erro em sitemap:", error);

  const productEntries: MetadataRoute.Sitemap = (data ?? []).map((p) => ({
    url: `${CELLSHOP_URL}/produto/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
  }));

  return [{ url: `${CELLSHOP_URL}/` }, ...productEntries];
}
