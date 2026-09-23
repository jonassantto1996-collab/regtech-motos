-- Fecha o bypass do rate limit: visitantes não podem mais inserir leads
-- diretamente pela API pública do Supabase. Toda criação passa pela Server
-- Action createLead(), que valida entrada e consome os contadores de rate limit
-- antes de persistir usando service_role.
drop policy if exists "Public can create leads" on public.leads;

revoke insert on table public.leads from public, anon, authenticated;
grant insert on table public.leads to service_role;
