import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CELLSHOP_URL } from "@/lib/cellshop/config";
import { isProductionSite, sendIndexNow } from "@/lib/seo/indexnow";

/**
 * Avisos do IndexNow para a Regtech Cell Shop (regtechcellshop.com.br).
 * Tudo roda depois da resposta do painel: nunca atrasa nem quebra o salvamento.
 */

/** Avisa a página do produto (e a vitrine) depois de uma mudança no painel. */
export function notifyStoreProduct(productId: string) {
  if (!isProductionSite()) return;
  after(async () => {
    try {
      const { data } = await createAdminClient().from("store_products").select("slug").eq("id", productId).maybeSingle();
      await sendIndexNow(CELLSHOP_URL, data?.slug ? [`/produto/${data.slug}`, "/"] : ["/"]);
    } catch {
      // Silencioso: o Bing ainda lê a loja pelo mapa do site.
    }
  });
}

/** Avisa todos os produtos ativos (ex.: quando muda o preço exibido na loja). */
export function notifyAllStoreProducts() {
  if (!isProductionSite()) return;
  after(async () => {
    try {
      const { data } = await createAdminClient().from("store_products").select("slug").eq("is_active", true).limit(1000);
      await sendIndexNow(CELLSHOP_URL, ["/", ...(data ?? []).map((p) => `/produto/${p.slug}`)]);
    } catch {
      // Silencioso.
    }
  });
}
