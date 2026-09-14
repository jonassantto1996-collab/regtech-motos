create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text,
  image_url text,
  display_order integer not null default 0,
  is_main boolean not null default false,
  alt_text text,
  created_at timestamptz not null default now()
);

comment on table public.product_images is 'Imagens vinculadas a um produto. Compatível com Supabase Storage (bucket ainda não criado).';

create index product_images_product_id_idx on public.product_images (product_id);

-- Garante no máximo uma imagem marcada como principal por produto
create unique index product_images_one_main_per_product_idx
  on public.product_images (product_id)
  where is_main = true;
