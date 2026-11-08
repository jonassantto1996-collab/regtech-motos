"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction, requireAdminSession } from "@/app/admin/products/actions";
import type { CartStatus } from "@/lib/cellshop/cart-recovery";

/** Painel → Loja → Carrinhos parados: marcar o que a equipe fez com cada carrinho. */
const PAGE = "/admin/store/carrinhos";
const STATUSES: CartStatus[] = ["open", "contacted", "won", "lost"];

function back(filter: string, extra: string) {
  return `${PAGE}?filtro=${encodeURIComponent(filter)}&${extra}`;
}

export async function setCartStatus(id: string, status: CartStatus, filter: string) {
  const user = await requireAdminSession();
  if (!STATUSES.includes(status)) redirect(back(filter, "error=1"));
  const admin = createAdminClient();
  const { error } = await admin
    .from("store_carts")
    .update({ status, status_changed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) redirect(back(filter, "error=1"));
  await logAdminAction(user, `store_cart.${status}`, "store_cart", id);
  redirect(back(filter, `saved=${status}`));
}

export async function saveCartNote(id: string, filter: string, formData: FormData) {
  const user = await requireAdminSession();
  const note = String(formData.get("admin_note") ?? "").trim().slice(0, 500);
  const admin = createAdminClient();
  const { error } = await admin.from("store_carts").update({ admin_note: note || null }).eq("id", id);
  if (error) redirect(back(filter, "error=1"));
  await logAdminAction(user, "store_cart.note", "store_cart", id);
  redirect(back(filter, "saved=note"));
}
