revoke all on table public.admin_users from public, anon, authenticated;
grant select, insert, update, delete on table public.admin_users to service_role;

revoke all on table public.lead_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.lead_rate_limits to service_role;
