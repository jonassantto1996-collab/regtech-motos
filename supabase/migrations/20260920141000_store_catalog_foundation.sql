create table public.store_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  slug text not null unique check (length(trim(slug)) between 1 and 100),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.store_products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.store_categories(id) on delete restrict,
  brand text not null check (length(trim(brand)) between 1 and 80),
  name text not null check (length(trim(name)) between 1 and 160),
  slug text not null unique check (length(trim(slug)) between 1 and 180),
  sku text unique,
  description text not null default '' check (length(description) <= 5000),
  price numeric(10,2) not null check (price >= 0),
  availability text not null default 'Disponível' check (length(availability) <= 80),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index store_products_category_active_idx on public.store_products(category_id,is_active);
create index store_products_created_at_idx on public.store_products(created_at desc);
alter table public.store_categories enable row level security;
alter table public.store_products enable row level security;
create policy "Public can read active store categories" on public.store_categories for select to anon, authenticated using (is_active = true);
create policy "Public can read active store products" on public.store_products for select to anon, authenticated using (is_active = true);
insert into public.store_categories(name,slug,sort_order) values
 ('Celulares','celulares',10),('Bombox / Áudio','bombox-audio',20),('TVs','tvs',30),('Starlink','starlink',40),('Outros produtos','outros-produtos',50);
