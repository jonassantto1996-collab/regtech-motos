-- Configuração geral do catálogo (linha única). Por enquanto guarda só a
-- chave "mostrar preços no site", controlada pelo painel.
create table if not exists public.catalog_settings (
  id boolean primary key default true check (id = true),
  show_prices boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.catalog_settings enable row level security;
grant select on table public.catalog_settings to anon, authenticated, service_role;
grant insert, update on table public.catalog_settings to service_role;

create policy "Public can read catalog settings"
on public.catalog_settings for select to anon, authenticated
using (true);

insert into public.catalog_settings (id) values (true) on conflict (id) do nothing;

create trigger set_catalog_settings_updated_at
before update on public.catalog_settings
for each row execute function public.set_updated_at();

-- Escrita só pelo servidor (service_role). Ninguém do lado público altera.
revoke insert, update, delete, truncate, references, trigger on table public.catalog_settings from anon, authenticated;
