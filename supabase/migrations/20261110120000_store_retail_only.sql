-- Produto "só varejo": aparece normalmente para o cliente final, mas some para o
-- lojista aprovado (vitrine, busca e link do produto da Área do Lojista).
alter table public.store_products add column if not exists retail_only boolean not null default false;
comment on column public.store_products.retail_only is 'Só varejo: não aparece para lojistas aprovados (atacado).';
grant select (retail_only) on table public.store_products to anon, authenticated;

-- Um produto não pode ser "só varejo" e "só atacado" ao mesmo tempo.
alter table public.store_products drop constraint if exists store_products_retail_or_wholesale_only;
alter table public.store_products add constraint store_products_retail_or_wholesale_only
  check (not (retail_only and wholesale_only));
