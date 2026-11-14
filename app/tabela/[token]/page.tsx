import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPriceTable, isPriceTableToken, type PriceTableProduct } from "@/lib/cellshop/price-table";
import PriceTable from "@/components/cellshop/PriceTable";

/**
 * Tabela de atacado do vendedor (regtechcellshop.com.br/tabela/<link secreto>).
 * Sem login: quem tem o link vê os preços de atacado. O link é trocado no painel
 * (Loja completa → Tabela do vendedor) e o antigo para de funcionar na hora.
 * Sempre busca os preços no banco ao abrir: bate com o painel.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tabela de atacado | Regtech Cell Shop",
  description: "Preços de atacado da Regtech Cell Shop. Uso interno da loja.",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
  formatDetection: { telephone: false },
  appleWebApp: { capable: true, title: "Atacado Regtech", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#070a12" };

function sameToken(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

const updatedFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Belem" });

export default async function PriceTablePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isPriceTableToken(token)) notFound();

  const admin = createAdminClient();
  const { data: link } = await admin.from("store_price_table").select("token").eq("id", true).maybeSingle();
  if (!link?.token || !sameToken(link.token, token)) notFound();

  const [{ data: categories }, { data: products, error }] = await Promise.all([
    admin.from("store_categories").select("id,name").eq("is_active", true).order("sort_order"),
    admin
      .from("store_products")
      .select(
        "id,brand,name,category_id,wholesale_price,wholesale_note," +
          "store_product_images(storage_path,display_order)," +
          "store_product_variants(id,name,wholesale_price,is_active)",
      )
      .eq("is_active", true)
      .eq("retail_only", false),
  ]);
  if (error) throw new Error("Não foi possível carregar a tabela de atacado.");

  const sections = buildPriceTable(categories ?? [], (products ?? []) as unknown as PriceTableProduct[]);
  const [date, time] = updatedFormat.format(new Date()).split(", ");

  return <PriceTable sections={sections} updatedLabel={`em ${date} às ${time}`} />;
}
