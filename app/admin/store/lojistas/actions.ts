"use server";

import { randomInt } from "node:crypto";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction, requireAdminSession } from "@/app/admin/products/actions";
import { temporaryPassword, type ResellerStatus } from "@/lib/store/resellers";

/** Painel → Loja → Lojistas: aprovar, recusar, bloquear e trocar a senha. */
const PAGE = "/admin/store/lojistas";
const STATUSES: ResellerStatus[] = ["pending", "approved", "rejected", "blocked"];

export async function setResellerStatus(id: string, status: ResellerStatus) {
  const user = await requireAdminSession();
  if (!STATUSES.includes(status)) redirect(`${PAGE}?error=1`);
  const admin = createAdminClient();
  const { error } = await admin
    .from("store_resellers")
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...(status === "approved" ? { approved_at: new Date().toISOString(), approved_by: user } : {}),
    })
    .eq("id", id);
  if (error) redirect(`${PAGE}?error=1`);
  await logAdminAction(user, `store_reseller.${status}`, "store_reseller", id);
  redirect(`${PAGE}?saved=${status}`);
}

export async function saveResellerNotes(id: string, formData: FormData) {
  const user = await requireAdminSession();
  const notes = String(formData.get("admin_notes") ?? "").trim().slice(0, 500);
  const admin = createAdminClient();
  const { error } = await admin
    .from("store_resellers")
    .update({ admin_notes: notes || null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) redirect(`${PAGE}?error=1`);
  await logAdminAction(user, "store_reseller.notes", "store_reseller", id);
  redirect(`${PAGE}?saved=notes`);
}

/** Gera uma senha provisória para o lojista que esqueceu a dele (mostrada só uma vez). */
export async function resetResellerPassword(id: string): Promise<{ ok: true; password: string } | { ok: false }> {
  const user = await requireAdminSession();
  const admin = createAdminClient();
  const { data: reseller } = await admin.from("store_resellers").select("user_id").eq("id", id).maybeSingle();
  if (!reseller) return { ok: false };
  const password = temporaryPassword((max) => randomInt(max));
  const { error } = await admin.auth.admin.updateUserById(reseller.user_id, { password });
  if (error) return { ok: false };
  await logAdminAction(user, "store_reseller.reset_password", "store_reseller", id);
  return { ok: true, password };
}
