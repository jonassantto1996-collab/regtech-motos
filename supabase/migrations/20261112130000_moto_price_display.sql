-- Como o site das motos mostra os preços (painel → Motos → Preços no site):
-- 'full' = à vista + parcelado; 'installments' = só o parcelado no cartão.
-- "Ocultar preços" continua sendo show_prices = false.
alter table public.catalog_settings
  add column if not exists moto_price_display text not null default 'full'
  check (moto_price_display in ('full', 'installments'));
