import type { MetadataRoute } from "next";
import { CELLSHOP_URL, isCellshopHost } from "@/lib/cellshop/config";
import { getSiteUrl } from "@/lib/site-url";

// Depende do domínio (Regtech Motors ou Regtech Cell Shop), então não pode
// ser gerado uma vez só no build.
export const dynamic = "force-dynamic";

const AGENTS = ["*", "OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User"];

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (await isCellshopHost()) {
    return {
      rules: AGENTS.map((userAgent) => ({ userAgent, allow: "/", disallow: ["/admin", "/api"] })),
      sitemap: `${CELLSHOP_URL}/sitemap.xml`,
    };
  }

  const siteUrl = getSiteUrl();
  return {
    rules: AGENTS.map((userAgent) => ({ userAgent, allow: "/", disallow: "/admin" })),
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
