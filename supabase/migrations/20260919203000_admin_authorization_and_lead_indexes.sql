create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'ADMIN' check (role in ('ADMIN')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

-- Bootstrap only existing trusted Auth users at migration time.
insert into public.admin_users (user_id, role, is_active)
select id, 'ADMIN', true from auth.users;

create index if not exists leads_whatsapp_created_at_idx
  on public.leads (whatsapp, created_at desc);
create index if not exists leads_status_created_at_idx
  on public.leads (status, created_at desc);
