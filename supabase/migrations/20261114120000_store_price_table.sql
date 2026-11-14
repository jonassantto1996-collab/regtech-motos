-- Tabela de atacado do vendedor (Regtech Cell Shop): link secreto, sem login.
-- Uma linha só. Só o servidor (chave de serviço) lê e troca o link; quem visita o site não tem acesso.
create table if not exists public.store_price_table (
  id boolean primary key default true check (id),
  token text not null check (token ~ '^[a-z0-9]{40,64}$'),
  created_at timestamptz not null default now()
);

alter table public.store_price_table enable row level security;
revoke all on table public.store_price_table from anon, authenticated;

-- Primeiro link (64 caracteres aleatórios); o painel gera outro quando quiser.
insert into public.store_price_table (id, token)
values (true, replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
on conflict (id) do nothing;
