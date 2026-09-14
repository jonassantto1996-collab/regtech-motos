create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text not null,
  slug text not null unique,
  sku text unique,
  category text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  availability text,
  warranty text,
  pickup_available boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.products is 'Catálogo de produtos comerciais da Regtech Motos.';
comment on column public.products.availability is 'Texto livre; valores permitidos ainda não definidos pelo negócio.';
comment on column public.products.warranty is 'Texto livre descrevendo a garantia (formato/unidade ainda não definidos pelo negócio).';

create index products_is_active_idx on public.products (is_active);
create index products_brand_idx on public.products (brand);
create index products_category_idx on public.products (category);

create trigger set_products_updated_at
  before update on public.products
  for each row
  execute function public.set_updated_at();
