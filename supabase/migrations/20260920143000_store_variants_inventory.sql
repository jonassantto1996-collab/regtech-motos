create table public.store_product_variants (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.store_products(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 120),
 sku text unique,
 attributes jsonb not null default '{}'::jsonb,
 price numeric(10,2) check(price is null or price >= 0),
 stock_quantity integer not null default 0 check(stock_quantity >= 0),
 low_stock_threshold integer not null default 2 check(low_stock_threshold >= 0),
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index store_variants_product_idx on public.store_product_variants(product_id,is_active);
create index store_variants_stock_idx on public.store_product_variants(stock_quantity);
alter table public.store_product_variants enable row level security;
create policy "Public can read active store variants" on public.store_product_variants for select to anon,authenticated using(is_active=true and exists(select 1 from public.store_products p where p.id=product_id and p.is_active=true));