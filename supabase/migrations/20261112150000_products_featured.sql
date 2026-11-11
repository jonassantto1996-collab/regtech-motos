-- Destaques do site (painel → Motos → Destacar): até 4 motos aparecem primeiro
-- na Home e no catálogo, na ordem escolhida (1º a 4º).
alter table public.products
  add column if not exists featured_rank smallint
  check (featured_rank is null or featured_rank between 1 and 4);
create unique index if not exists products_featured_rank_key
  on public.products (featured_rank) where featured_rank is not null;
-- O site ordena por essa coluna com a chave pública.
grant select (featured_rank) on public.products to anon, authenticated;
