-- Banners do topo (hero) da Regtech Cell Shop.
-- Cada banner tem uma imagem por tela: computador, tablet e celular.
-- As imagens ficam no bucket público product-images, em store-banners/.
create table if not exists public.store_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 120),
  link_url text check (link_url is null or char_length(link_url) between 1 and 300),
  desktop_path text not null check (char_length(desktop_path) between 1 and 300),
  desktop_width integer check (desktop_width is null or desktop_width > 0),
  desktop_height integer check (desktop_height is null or desktop_height > 0),
  tablet_path text check (tablet_path is null or char_length(tablet_path) between 1 and 300),
  tablet_width integer check (tablet_width is null or tablet_width > 0),
  tablet_height integer check (tablet_height is null or tablet_height > 0),
  mobile_path text check (mobile_path is null or char_length(mobile_path) between 1 and 300),
  mobile_width integer check (mobile_width is null or mobile_width > 0),
  mobile_height integer check (mobile_height is null or mobile_height > 0),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_banners_order_idx on public.store_banners(is_active, display_order);

alter table public.store_banners enable row level security;

-- O site só lê os banners ativos. Gravação só pelo servidor (painel).
create policy "Public can read active store banners"
on public.store_banners for select to anon, authenticated
using (is_active = true);

revoke all on table public.store_banners from anon, authenticated;
grant select on table public.store_banners to anon, authenticated;
grant select, insert, update, delete on table public.store_banners to service_role;
