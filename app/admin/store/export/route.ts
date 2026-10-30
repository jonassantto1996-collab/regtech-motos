import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/app/admin/products/actions";

/**
 * Exporta a loja para planilha (CSV que abre direto no Excel / Google Planilhas).
 * Uma linha por versão (variante) do produto, com estoque e preços.
 * Ponto e vírgula como separador e vírgula nos centavos: padrão do Excel em português.
 */
export const dynamic = "force-dynamic";

type Money = number | string | null;

function moneyCell(value: Money): string {
  if (value === null || value === undefined || value === "") return "";
  return Number(value).toFixed(2).replace(".", ",");
}

function cell(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);
  // Evita que a planilha interprete o texto como fórmula.
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  await requireAdminSession();
  const admin = createAdminClient();

  const [{ data: categories }, { data: products }, { data: variants }] = await Promise.all([
    admin.from("store_categories").select("id,name"),
    admin
      .from("store_products")
      .select("id,category_id,brand,name,sku,price,wholesale_price,card_price,card_installments,warranty,availability,is_active,slug")
      .order("brand")
      .order("name"),
    admin
      .from("store_product_variants")
      .select("product_id,name,sku,price,wholesale_price,stock_quantity,is_active")
      .order("created_at"),
  ]);

  const categoryName = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const variantsByProduct = new Map<string, NonNullable<typeof variants>>();
  for (const v of variants ?? []) {
    const list = variantsByProduct.get(v.product_id) ?? [];
    list.push(v);
    variantsByProduct.set(v.product_id, list);
  }

  const header = [
    "Categoria", "Marca", "Produto", "Versão", "Código", "Estoque",
    "Preço varejo", "Preço atacado", "Total no cartão", "Parcelas",
    "Garantia", "Disponibilidade", "Ativo no site", "Endereço da página",
  ];
  const rows: string[] = [header.join(";")];

  for (const p of products ?? []) {
    const productVariants = variantsByProduct.get(p.id) ?? [];
    const lines = productVariants.length ? productVariants : [null];
    for (const v of lines) {
      rows.push(
        [
          cell(categoryName.get(p.category_id) ?? ""),
          cell(p.brand),
          cell(p.name),
          cell(v?.name ?? ""),
          cell(v?.sku ?? p.sku ?? ""),
          cell(v ? v.stock_quantity : ""),
          moneyCell(v?.price ?? p.price),
          moneyCell(v?.wholesale_price ?? p.wholesale_price),
          moneyCell(p.card_price),
          cell(p.card_installments ?? ""),
          cell(p.warranty),
          cell(p.availability),
          p.is_active ? "Sim" : "Não",
          cell(`/produto/${p.slug}`),
        ].join(";")
      );
    }
  }

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Belem" });
  const body = "﻿" + rows.join("\r\n");
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="loja-regtech-${today}.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
