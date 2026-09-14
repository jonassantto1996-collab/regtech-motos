create table public.product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color text not null,
  created_at timestamptz not null default now(),
  unique (product_id, color)
);

comment on table public.product_colors is 'Cores disponíveis por produto.';

create index product_colors_product_id_idx on public.product_colors (product_id);
