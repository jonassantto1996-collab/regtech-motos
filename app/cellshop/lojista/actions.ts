"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCellshopBase } from "@/lib/cellshop/config";
import { hashRateLimitKey, isRateLimitAllowed } from "@/lib/leads/rate-limit";
import { parseResellerSignup } from "@/lib/store/resellers";

/**
 * Área do Lojista: cadastro, entrada e saída.
 * O cadastro nasce "em análise"; quem aprova é a Regtech, no painel.
 * Nenhum e-mail é enviado: a conta é criada já confirmada (a aprovação é manual).
 */
export type ResellerFormResult = { error: string } | undefined;

async function allowed(key: string, windowSeconds: number, max: number) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_lead_rate_limit", {
    p_key_hash: hashRateLimitKey(`reseller:${key}`, process.env.SUPABASE_SERVICE_ROLE_KEY),
    p_window_seconds: windowSeconds,
    p_max_requests: max,
  });
  if (error) console.error("[lojista] rate limit:", error.message);
  return isRateLimitAllowed(data, error);
}

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

async function lojistaPath() {
  return `${await getCellshopBase()}/lojista`;
}

export async function signupReseller(formData: FormData): Promise<ResellerFormResult> {
  // Campo escondido: robô preenche, gente não.
  if (String(formData.get("website") ?? "")) return { error: "server_error" };
  const parsed = parseResellerSignup(formData);
  if (!parsed.ok) return { error: parsed.error };
  const data = parsed.data;

  const ip = await clientIp();
  if (!(await allowed(`signup:${ip}`, 3600, 5))) return { error: "rate_limited" };

  const admin = createAdminClient();
  const { data: sameDocument } = await admin.from("store_resellers").select("id").eq("document", data.document).maybeSingle();
  if (sameDocument) return { error: "document_taken" };

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { kind: "reseller", name: data.contact_name },
  });
  if (createError || !created.user) {
    const taken = createError?.status === 422 || /already|registered|exists/i.test(createError?.message ?? "");
    if (!taken) console.error("[lojista] criar conta:", createError?.message);
    return { error: taken ? "email_taken" : "server_error" };
  }

  const { error: insertError } = await admin.from("store_resellers").insert({
    user_id: created.user.id,
    contact_name: data.contact_name,
    store_name: data.store_name,
    document: data.document,
    whatsapp: data.whatsapp,
    city: data.city,
    email: data.email,
  });
  if (insertError) {
    // Não deixa conta sem cadastro de lojista.
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: insertError.code === "23505" ? "document_taken" : "server_error" };
  }

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
  redirect(`${await lojistaPath()}?novo=1`);
}

export async function loginReseller(formData: FormData): Promise<ResellerFormResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "missing_fields" };

  const ip = await clientIp();
  if (!(await allowed(`login:${ip}`, 900, 15)) || !(await allowed(`login:${email}`, 900, 8))) {
    return { error: "rate_limited" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "invalid_credentials" };

  const admin = createAdminClient();
  const { data: reseller } = await admin.from("store_resellers").select("id").eq("user_id", data.user.id).maybeSingle();
  if (!reseller) {
    await supabase.auth.signOut();
    return { error: "not_reseller" };
  }
  redirect(await lojistaPath());
}

export async function logoutReseller() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect((await getCellshopBase()) || "/");
}
