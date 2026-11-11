-- Financiamento pelo banco (ex.: T-MOV em até 48x). Quando preenchido, o site
-- mostra "Financie em até Nx pelo banco" no lugar do parcelado no cartão.
alter table public.products
  add column if not exists financing_installments smallint
  check (financing_installments is null or financing_installments between 2 and 120);
-- O site lê products com a chave pública só por colunas liberadas (ver 20261111121000).
grant select (financing_installments) on public.products to anon, authenticated;
