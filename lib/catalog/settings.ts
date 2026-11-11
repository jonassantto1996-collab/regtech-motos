import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { resolvePriceDisplay, type PriceDisplay } from "@/lib/catalog/format";

export type CatalogSettings = {
  /** Preço completo (à vista + cartão) visível. Só é true no modo "full". */
  showPrices: boolean;
  /**
   * Como o site das motos mostra os preços:
   * - "full": à vista e parcelado no cartão;
   * - "installments": só o parcelado no cartão (ex.: "12x de R$ 908,33"), sem à vista nem total;
   * - "hidden": "Consulte o valor".
   */
  priceDisplay: PriceDisplay;
};

/**
 * Lê a configuração geral do catálogo (uma vez por requisição).
 * Se a leitura falhar, mantém o comportamento padrão: preços visíveis.
 */
export const getCatalogSettings = cache(async (): Promise<CatalogSettings> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("catalog_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();

  if (error) {
    console.error("[catalog] erro ao ler catalog_settings:", error);
    return { showPrices: true, priceDisplay: "full" };
  }
  const row = data as { show_prices?: boolean; moto_price_display?: string } | null;
  const priceDisplay = resolvePriceDisplay(row?.show_prices, row?.moto_price_display);
  return { showPrices: priceDisplay === "full", priceDisplay };
});
