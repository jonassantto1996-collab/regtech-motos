import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CatalogSettings = {
  /** Quando false, o site esconde todos os preços e mostra "Consulte o valor". */
  showPrices: boolean;
};

/**
 * Lê a configuração geral do catálogo (uma vez por requisição).
 * Se a leitura falhar, mantém o comportamento padrão: preços visíveis.
 */
export const getCatalogSettings = cache(async (): Promise<CatalogSettings> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("catalog_settings")
    .select("show_prices")
    .eq("id", true)
    .maybeSingle();

  if (error) {
    console.error("[catalog] erro ao ler catalog_settings:", error);
    return { showPrices: true };
  }
  return { showPrices: data?.show_prices ?? true };
});
