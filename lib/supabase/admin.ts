import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com service_role — ignora RLS completamente.
 *
 * NUNCA importar este arquivo em Client Components, nem em qualquer código
 * que rode no navegador. Usar apenas dentro de Server Actions/Route Handlers
 * que já validaram a sessão do administrador (getClaims()) antes de chamar
 * isto. Este cliente não gerencia cookies/sessão — é autenticação por chave
 * de servidor, ponto a ponto.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (ou NEXT_PUBLIC_SUPABASE_URL) não configurada no ambiente."
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
