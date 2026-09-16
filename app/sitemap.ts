import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

// Sem essa diretiva, o Next.js poderia gerar o sitemap de forma estática
// no build — refletindo os produtos só até o próximo deploy, e não em
// tempo real. Mantém a mesma decisão de "sem cache" aplicada às páginas do
// catálogo (Decisão 6).
export const dynamic = "force-dynamic";

// Sem NEXT_PUBLIC_SITE_URL configurada não há como gerar URLs absolutas
// corretas — retorna sitemap vazio em vez de inventar um domínio (Decisão
// 9). Assim que a variável existir na Vercel, o sitemap passa a listar
// normalmente.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("is_active", true);

  if (error) {
    console.error("[catalog] erro em sitemap:", error);
    return [{ url: `${siteUrl}/products` }];
  }

  const productEntries: MetadataRoute.Sitemap = (data ?? []).map((p) => ({
    url: `${siteUrl}/products/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
  }));

  return [{ url: `${siteUrl}/products` }, ...productEntries];
}
