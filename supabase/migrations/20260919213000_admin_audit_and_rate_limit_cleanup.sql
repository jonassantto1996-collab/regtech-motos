create table public.admin_audit_log (
 id bigint generated always as identity primary key,
 admin_user_id uuid references auth.users(id) on delete set null,
 action text not null check (length(action) between 1 and 100),
 entity_type text not null check (length(entity_type) between 1 and 80),
 entity_id text,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
alter table public.admin_audit_log enable row level security;
create index admin_audit_log_created_at_idx on public.admin_audit_log(created_at desc);
create index admin_audit_log_entity_idx on public.admin_audit_log(entity_type,entity_id,created_at desc);
revoke all on table public.admin_audit_log from anon,authenticated;
create or replace function public.cleanup_lead_rate_limits(p_retention_hours integer default 24) returns integer language plpgsql security definer set search_path=public as $$
declare v_deleted integer;
begin
 if p_retention_hours < 1 or p_retention_hours > 720 then raise exception 'invalid_retention'; end if;
 delete from lead_rate_limits where updated_at < now()-make_interval(hours=>p_retention_hours);
 get diagnostics v_deleted=row_count; return v_deleted;
end; $$;
revoke all on function public.cleanup_lead_rate_limits(integer) from public,anon,authenticated;
grant execute on function public.cleanup_lead_rate_limits(integer) to service_role;
create or replace function public.log_admin_action(p_admin_user_id uuid,p_action text,p_entity_type text,p_entity_id text default null,p_metadata jsonb default '{}'::jsonb) returns bigint language plpgsql security definer set search_path=public as $$
declare v_id bigint;
begin
 if not exists(select 1 from admin_users where user_id=p_admin_user_id and role='ADMIN' and is_active=true) then raise exception 'not_authorized'; end if;
 insert into admin_audit_log(admin_user_id,action,entity_type,entity_id,metadata) values(p_admin_user_id,p_action,p_entity_type,p_entity_id,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
 return v_id;
end; $$;
revoke all on function public.log_admin_action(uuid,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.log_admin_action(uuid,text,text,text,jsonb) to service_role;