-- Chave "Preços no site" da Regtech Cell Shop (painel → Loja completa).
-- Desligada: o cliente final vê "Consulte o valor"; lojista aprovado continua vendo o atacado.
-- Independente da chave das motos (catalog_settings.show_prices).
alter table public.catalog_settings
  add column if not exists store_show_prices boolean not null default true;
