import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/app/admin/products/actions";
import { RESELLER_STATUS_LABEL, formatDocument, formatWhatsapp, type ResellerStatus } from "@/lib/store/resellers";

/** Exporta os lojistas para planilha (CSV com ponto e vírgula, padrão do Excel em português). */
export const dynamic = "force-dynamic";

function cell(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  await requireAdminSession();
  const admin = createAdminClient();
  const { data } = await admin
    .from("store_resellers")
    .select("store_name,contact_name,document,whatsapp,city,email,status,admin_notes,created_at,approved_at")
    .order("created_at", { ascending: false });

  const date = (v: string | null) => (v ? new Date(v).toLocaleDateString("pt-BR", { timeZone: "America/Belem" }) : "");
  const rows = [["Loja", "Responsável", "CNPJ/CPF", "WhatsApp", "Cidade", "E-mail", "Situação", "Observação", "Cadastro", "Aprovado em"].join(";")];
  for (const r of data ?? []) {
    rows.push(
      [
        cell(r.store_name),
        cell(r.contact_name),
        cell(formatDocument(r.document)),
        cell(formatWhatsapp(r.whatsapp)),
        cell(r.city),
        cell(r.email),
        cell(RESELLER_STATUS_LABEL[r.status as ResellerStatus] ?? r.status),
        cell(r.admin_notes),
        cell(date(r.created_at)),
        cell(date(r.approved_at)),
      ].join(";")
    );
  }
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Belem" });
  return new Response("﻿" + rows.join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="lojistas-regtech-${today}.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
