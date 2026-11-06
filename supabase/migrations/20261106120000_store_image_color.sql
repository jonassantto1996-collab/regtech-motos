-- Cor da foto: liga a foto à cor da versão (ex.: "Rosa"). Na página do produto,
-- ao escolher a versão, a galeria vai para a foto daquela cor. Vazio = foto geral.
alter table public.store_product_images
  add column if not exists color text
  check (color is null or char_length(btrim(color)) between 1 and 60);

-- A tabela usa permissão por coluna: a vitrine precisa ler a cor.
grant select (color) on public.store_product_images to anon, authenticated;
