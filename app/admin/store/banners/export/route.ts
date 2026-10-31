import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/app/admin/products/actions";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import { BANNER_DEVICES, DEVICE_LABEL } from "@/lib/store/banners";

/**
 * Exporta os banners do topo da loja para planilha (CSV que abre no Excel).
 * Ponto e vírgula como separador: padrão do Excel em português.
 */
export const dynamic = "force-dynamic";

function cell(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);
  // Evita que a planilha interprete o texto como fórmula.
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  await requireAdminSession();
  const admin = createAdminClient();
  const { data: banners } = await admin.from("store_banners").select("*").order("display_order").order("created_at");

  const header = [
    "Ordem no carrossel", "Nome do banner", "Link ao clicar", "Aparecendo no site",
    ...BANNER_DEVICES.flatMap((d) => [`${DEVICE_LABEL[d]}: tamanho`, `${DEVICE_LABEL[d]}: imagem`]),
    "Criado em", "Alterado em",
  ];
  const rows: string[] = [header.join(";")];
  const date = (value: string | null) =>
    value ? new Date(value).toLocaleString("pt-BR", { timeZone: "America/Belem", dateStyle: "short", timeStyle: "short" }) : "";

  (banners ?? []).forEach((b, index) => {
    rows.push(
      [
        cell(`${index + 2}º slide`),
        cell(b.title),
        cell(b.link_url ?? "Sem link"),
        b.is_active ? "Sim" : "Não",
        ...BANNER_DEVICES.flatMap((d) => {
          const path = b[`${d}_path`] as string | null;
          const w = b[`${d}_width`] as number | null;
          const h = b[`${d}_height`] as number | null;
          return [cell(path && w && h ? `${w} x ${h}` : ""), cell(path ? getPublicImageUrl(path) : "Usa a versão maior")];
        }),
        cell(date(b.created_at)),
        cell(date(b.updated_at)),
      ].join(";")
    );
  });

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Belem" });
  return new Response("﻿" + rows.join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="banners-loja-regtech-${today}.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
