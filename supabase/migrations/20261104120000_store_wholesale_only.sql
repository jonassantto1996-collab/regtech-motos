-- Produto "só atacado": some do site público e só aparece para lojista aprovado
-- (o servidor busca esses produtos com a chave de serviço, depois de conferir o lojista).
alter table public.store_products add column if not exists wholesale_only boolean not null default false;
comment on column public.store_products.wholesale_only is 'Só atacado: não aparece no site público; só lojistas aprovados veem.';
grant select (wholesale_only) on table public.store_products to anon, authenticated;

-- As regras públicas passam a esconder o produto "só atacado" (e as fotos, ficha e versões dele).
alter policy "Public can read active store products" on public.store_products
  using (is_active = true and wholesale_only = false);

alter policy "Public can read active store variants" on public.store_product_variants
  using (
    is_active = true and exists (
      select 1 from public.store_products p
      where p.id = store_product_variants.product_id and p.is_active = true and p.wholesale_only = false));

alter policy "Public can read specs of active store products" on public.store_product_specs
  using (
    exists (select 1 from public.store_products p
      where p.id = store_product_specs.product_id and p.is_active = true and p.wholesale_only = false));

alter policy "Public can read images of active store products" on public.store_product_images
  using (
    exists (select 1 from public.store_products p
      where p.id = store_product_images.product_id and p.is_active = true and p.wholesale_only = false));
