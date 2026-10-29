-- Regtech Cell Shop — fase 1 do catálogo da loja de tecnologia:
-- preço de varejo (coluna "price", que já existia), preço de atacado,
-- condição no cartão, garantia, fotos e ficha técnica.

alter table public.store_products
  add column if not exists wholesale_price numeric(10,2) check (wholesale_price is null or wholesale_price >= 0),
  add column if not exists card_price numeric(10,2) check (card_price is null or card_price >= 0),
  add column if not exists card_installments integer check (card_installments is null or card_installments between 1 and 24),
  add column if not exists warranty text not null default '' check (char_length(warranty) <= 120);

alter table public.store_product_variants
  add column if not exists wholesale_price numeric(10,2) check (wholesale_price is null or wholesale_price >= 0);

-- Qual preço a loja online mostra: atacado (padrão, decidido pelo Jonas) ou varejo.
alter table public.catalog_settings
  add column if not exists store_price_mode text not null default 'wholesale'
    check (store_price_mode in ('wholesale', 'retail'));

-- Fotos dos produtos da loja (a primeira da ordem é a principal).
create table if not exists public.store_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.store_products(id) on delete cascade,
  storage_path text not null unique check (char_length(storage_path) between 1 and 300),
  display_order integer not null default 0,
  alt_text text check (alt_text is null or char_length(alt_text) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists store_product_images_product_idx on public.store_product_images(product_id, display_order);

-- Ficha técnica (linhas "Tela: 6,7''", "Bateria: 5000 mAh"...).
create table if not exists public.store_product_specs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.store_products(id) on delete cascade,
  spec_key text not null check (char_length(trim(spec_key)) between 1 and 80),
  spec_value text not null check (char_length(trim(spec_value)) between 1 and 200),
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists store_product_specs_product_idx on public.store_product_specs(product_id, display_order);

alter table public.store_product_images enable row level security;
alter table public.store_product_specs enable row level security;

-- Leitura pública só do que pertence a produto ativo. Escrita só pelo servidor.
create policy "Public can read images of active store products"
on public.store_product_images for select to anon, authenticated
using (exists (select 1 from public.store_products p where p.id = product_id and p.is_active = true));

create policy "Public can read specs of active store products"
on public.store_product_specs for select to anon, authenticated
using (exists (select 1 from public.store_products p where p.id = product_id and p.is_active = true));

revoke all on table public.store_product_images from anon, authenticated;
revoke all on table public.store_product_specs from anon, authenticated;
grant select on table public.store_product_images to anon, authenticated;
grant select on table public.store_product_specs to anon, authenticated;
grant select, insert, update, delete on table public.store_product_images to service_role;
grant select, insert, update, delete on table public.store_product_specs to service_role;
