-- Leitura pública das imagens do bucket product-images.
-- O bucket já é público (buckets.public = true), então a URL pública gerada
-- via getPublicUrl() já funciona sem essa policy. Ela existe como defesa em
-- profundidade, cobrindo também o caminho autenticado da API de Storage.
create policy "Public can read product images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'product-images');

-- Nenhuma policy de INSERT/UPDATE/DELETE para anon/authenticated:
-- sem autenticação administrativa implementada ainda, escrita só é possível
-- via service_role (usada futuramente pelo backend do painel admin).
