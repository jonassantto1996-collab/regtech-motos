import type { Metadata } from "next";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "../../products/actions";
import { brochurePrice, brochureYear, paginate, parseBrochureMode, type BrochureMode } from "@/lib/catalog/brochure";
import { CatalogBrochure, type BrochureRow } from "./CatalogBrochure";
import { PrintButton } from "./PrintButton";
import "./catalogo.css";

export const dynamic = "force-dynamic";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], display: "swap" });

const MODE_LABEL: Record<BrochureMode, string> = { varejo: "Varejo", atacado: "Atacado" };

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ tipo?: string }> }): Promise<Metadata> {
  const mode = parseBrochureMode((await searchParams).tipo);
  // O título vira o nome do arquivo quando o navegador salva em PDF.
  return { title: `Catálogo Regtech Motors ${brochureYear()} - ${MODE_LABEL[mode]}`, robots: { index: false, follow: false } };
}

export default async function CatalogPdfPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  await requireAdminSession();
  const mode = parseBrochureMode((await searchParams).tipo);
  const year = brochureYear();

  const { data, error } = await createAdminClient()
    .from("products")
    .select(
      "id,brand,model,category,description,price,wholesale_price,product_images(storage_path,display_order,is_main),product_colors(color,created_at),product_specs(spec_key,spec_value,created_at)",
    )
    .eq("is_active", true)
    .order("price", { ascending: true });
  if (error) throw new Error("Não foi possível carregar as motos.");

  const rows = (data ?? []) as unknown as BrochureRow[];
  const pages = paginate(rows);
  const missingWholesale = mode === "atacado" ? rows.filter((r) => brochurePrice("atacado", r).kind === "consulte").length : 0;
  const otherMode: BrochureMode = mode === "varejo" ? "atacado" : "varejo";

  return (
    <div className={`cat-root ${poppins.className}`}>
      <div className="cat-toolbar">
        <div>
          <strong>
            Catálogo {MODE_LABEL[mode]} · {rows.length} motos · {pages.length + 1} páginas
          </strong>
          <span>
            Clique em “Salvar em PDF” e, na janela que abrir, escolha <b>Salvar como PDF</b>. No celular: menu do navegador →
            Compartilhar → Imprimir → Salvar como PDF.
            {missingWholesale > 0 && ` Atenção: ${missingWholesale} moto(s) sem preço de atacado aparecem como “Consulte”.`}
          </span>
        </div>
        <div className="cat-toolbar-actions">
          <Link href={`/admin/catalogo/pdf?tipo=${otherMode}`}>Ver {MODE_LABEL[otherMode].toLowerCase()}</Link>
          <Link href="/admin/catalogo">Voltar</Link>
          <PrintButton />
        </div>
      </div>

      <CatalogBrochure rows={rows} mode={mode} year={year} />
    </div>
  );
}
