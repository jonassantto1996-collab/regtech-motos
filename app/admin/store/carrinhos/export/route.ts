import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/app/admin/products/actions";
import { CART_STATUS_LABEL, formatPhone, isStaleCart, type CartStatus } from "@/lib/cellshop/cart-recovery";
import { DEVICE_LABELS, TRAFFIC_SOURCE_LABELS, type Device, type TrafficSource } from "@/lib/analytics/sources";

/** Exporta os carrinhos para planilha (CSV com ponto e vírgula, padrão do Excel em português). */
export const dynamic = "force-dynamic";

function cell(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

type Item = { title: string; variantName: string | null; qty: number };

export async function GET() {
  await requireAdminSession();
  const admin = createAdminClient();
  const { data } = await admin
    .from("store_carts")
    .select("mode,items,item_count,total,has_unpriced,contact_name,whatsapp,status,admin_note,device,traffic_source,city,created_at,updated_at,store_resellers(store_name)")
    .order("updated_at", { ascending: false })
    .limit(5000);

  const date = (v: string | null) => (v ? new Date(v).toLocaleString("pt-BR", { timeZone: "America/Belem" }) : "");
  const money = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const rows = [
    ["Situação", "Cliente", "WhatsApp", "Tipo", "Itens", "Qtd. de unidades", "Total (R$)", "Itens a consultar", "Origem", "Aparelho", "Cidade", "Criado em", "Última mudança", "Observação"].join(";"),
  ];
  for (const r of data ?? []) {
    const reseller = r.store_resellers as unknown as { store_name: string } | null;
    const items = (r.items as Item[]) ?? [];
    const status = isStaleCart(r) ? "Parado há mais de 24h" : CART_STATUS_LABEL[r.status as CartStatus] ?? r.status;
    rows.push(
      [
        cell(status),
        cell(r.contact_name ?? (reseller ? `${reseller.store_name} (lojista)` : "")),
        cell(r.whatsapp ? formatPhone(r.whatsapp) : ""),
        cell(r.mode === "wholesale" ? "Atacado" : "Varejo"),
        cell(items.map((i) => `${i.qty}x ${i.title}${i.variantName ? ` (${i.variantName})` : ""}`).join(" | ")),
        cell(r.item_count),
        cell(money(Number(r.total ?? 0))),
        cell(r.has_unpriced ? "Sim" : "Não"),
        cell(r.traffic_source ? TRAFFIC_SOURCE_LABELS[r.traffic_source as TrafficSource] : ""),
        cell(r.device ? DEVICE_LABELS[r.device as Device] : ""),
        cell(r.city),
        cell(date(r.created_at)),
        cell(date(r.updated_at)),
        cell(r.admin_note),
      ].join(";"),
    );
  }
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Belem" });
  return new Response("﻿" + rows.join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="carrinhos-regtech-${today}.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
