"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { OFFICIAL_SITE_URL } from "@/lib/site-url";
import { logAdminAction, requireAdminSession } from "../products/actions";

function normalizeEmail(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function normalizeName(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim().replace(/\s+/g, " ");
  return name.length >= 2 && name.length <= 120 ? name : null;
}

export async function inviteAdminUser(formData: FormData) {
  const actorUserId = await requireAdminSession();
  const name = normalizeName(formData.get("name"));
  const email = normalizeEmail(formData.get("email"));

  if (!name) redirect("/admin/users?error=invalid_name");
  if (!email) redirect("/admin/users?error=invalid_email");

  const admin = createAdminClient();

  const { data: existingUsers, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) redirect("/admin/users?error=server_error");

  const existing = existingUsers.users.find(
    (user) => user.email?.toLowerCase() === email
  );

  let userId: string;
  let invited = false;

  if (existing) {
    userId = existing.id;

    const nextMetadata = {
      ...(existing.user_metadata ?? {}),
      display_name: name,
    };

    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: nextMetadata,
    });

    if (updateError) redirect("/admin/users?error=server_error");
  } else {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${OFFICIAL_SITE_URL}/admin/auth/callback?next=/admin/reset-password`,
      data: { display_name: name },
    });

    if (error || !data.user) {
      redirect("/admin/users?error=invite_failed");
    }

    userId = data.user.id;
    invited = true;
  }

  const { error: authorizationError } = await admin
    .from("admin_users")
    .upsert(
      { user_id: userId, role: "ADMIN", is_active: true },
      { onConflict: "user_id" }
    );

  if (authorizationError) {
    redirect("/admin/users?error=authorization_failed");
  }

  await logAdminAction(
    actorUserId,
    invited ? "admin_user.invite" : "admin_user.enable",
    "admin_user",
    userId,
    { email }
  );

  redirect(`/admin/users?success=${invited ? "invited" : "enabled"}`);
}

export async function setAdminUserActive(userId: string, nextValue: boolean) {
  const actorUserId = await requireAdminSession();

  if (actorUserId === userId && !nextValue) {
    redirect("/admin/users?error=cannot_disable_self");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("admin_users")
    .update({ is_active: nextValue })
    .eq("user_id", userId);

  if (error) redirect("/admin/users?error=server_error");

  await logAdminAction(
    actorUserId,
    nextValue ? "admin_user.enable" : "admin_user.disable",
    "admin_user",
    userId
  );

  redirect(`/admin/users?success=${nextValue ? "enabled" : "disabled"}`);
}
