-- O preço de atacado não pode sair pela chave pública do site.
-- A tabela tinha SELECT liberado inteiro para anon/authenticated (padrão do Supabase),
-- então troca pelo SELECT só das colunas públicas. O painel usa a chave de serviço e continua vendo tudo.
-- Atenção: coluna nova em products que o site precise ler tem de entrar num GRANT como o de baixo.
revoke select on public.products from anon, authenticated;
grant select (id, brand, model, slug, sku, category, description, price, availability, warranty, pickup_available,
  is_active, created_at, updated_at, card_price, card_installments) on public.products to anon, authenticated;
