"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction, requireAdminSession } from "../products/actions";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/leads/types";

/**
 * Altera o status de um lead. A RLS não permite UPDATE em leads nem para
 * usuário autenticado (só a política de INSERT público existe) — por isso
 * esta ação exige sessão de admin e usa service_role, mesmo padrão já usado
 * em toggleProductActive.
 */
export async function updateLeadStatus(leadId: string, formData: FormData) {
  const adminUserId = await requireAdminSession();

  const rawStatus = formData.get("status");
  if (
    typeof rawStatus !== "string" ||
    !LEAD_STATUSES.includes(rawStatus as LeadStatus)
  ) {
    redirect("/admin/leads?error=invalid_status");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("leads")
    .update({ status: rawStatus })
    .eq("id", leadId);

  if (error) {
    redirect("/admin/leads?error=server_error");
  }

  await logAdminAction(adminUserId, "lead.status_update", "lead", leadId, { status: rawStatus });
  redirect("/admin/leads");
}
