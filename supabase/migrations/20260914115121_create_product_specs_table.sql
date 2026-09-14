create table public.product_specs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  spec_key text not null,
  spec_value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, spec_key)
);

comment on table public.product_specs is 'Ficha técnica por produto, no formato chave/valor (EAV). Nenhum dado inserido nesta etapa.';

create index product_specs_product_id_idx on public.product_specs (product_id);

create trigger set_product_specs_updated_at
  before update on public.product_specs
  for each row
  execute function public.set_updated_at();
