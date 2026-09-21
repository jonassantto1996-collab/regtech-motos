"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction, requireAdminSession } from "./actions";

export async function adjustMotoInventoryStock(
  productId: string,
  color: string,
  formData: FormData
) {
  const userId = await requireAdminSession();
  const rawQuantity = String(formData.get("stock_quantity") ?? "").trim();
  const quantity = Number(rawQuantity);
  const note = String(formData.get("note") ?? "").trim();

  if (!Number.isInteger(quantity) || quantity < 0) {
    redirect(`/admin/products/${productId}/edit?stock_error=invalid_quantity`);
  }
  if (!color.trim() || color.length > 80) {
    redirect(`/admin/products/${productId}/edit?stock_error=invalid_color`);
  }
  if (note.length > 200) {
    redirect(`/admin/products/${productId}/edit?stock_error=note_too_long`);
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("adjust_moto_inventory_stock", {
    p_product_id: productId,
    p_color: color,
    p_new_quantity: quantity,
    p_actor_user_id: userId,
    p_note: note || null,
  });

  if (error) {
    redirect(`/admin/products/${productId}/edit?stock_error=server_error`);
  }

  const movement = Array.isArray(data) ? data[0] : null;
  await logAdminAction(userId, "moto_inventory.adjust", "product", productId, {
    color,
    previous_quantity: movement?.previous_quantity ?? null,
    current_quantity: quantity,
    movement_id: movement?.movement_id ?? null,
  });

  redirect(`/admin/products/${productId}/edit?stock_saved=1`);
}
