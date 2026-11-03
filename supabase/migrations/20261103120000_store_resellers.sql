-- Área do Lojista da Regtech Cell Shop.
-- O site mostra o preço de varejo para todo mundo. O preço de atacado só
-- aparece para lojistas cadastrados e aprovados no painel.

create table if not exists public.store_resellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  contact_name text not null check (char_length(trim(contact_name)) between 2 and 120),
  store_name text not null check (char_length(trim(store_name)) between 2 and 120),
  document text not null unique check (document ~ '^([0-9]{11}|[0-9]{14})$'),
  whatsapp text not null check (whatsapp ~ '^[0-9]{10,13}$'),
  city text not null check (char_length(trim(city)) between 2 and 120),
  email text not null check (char_length(email) between 5 and 254),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'blocked')),
  admin_notes text check (admin_notes is null or char_length(admin_notes) <= 500),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_resellers_status_idx on public.store_resellers(status, created_at desc);

alter table public.store_resellers enable row level security;

-- O lojista logado só enxerga o próprio cadastro. Cadastro e aprovação: só pelo servidor.
create policy "Reseller reads own record"
on public.store_resellers for select to authenticated
using (user_id = (select auth.uid()));

revoke all on table public.store_resellers from anon, authenticated;
-- O lojista lê só o próprio cadastro e sem a observação interna (admin_notes).
grant select (id, user_id, contact_name, store_name, document, whatsapp, city, email, status, approved_at, created_at, updated_at)
  on table public.store_resellers to authenticated;
grant select, insert, update, delete on table public.store_resellers to service_role;

-- Condição especial de atacado (ex.: "1 unidade R$ 599; acima de 10, R$ 499"),
-- visível só para lojistas aprovados.
alter table public.store_products
  add column if not exists wholesale_note text check (wholesale_note is null or char_length(wholesale_note) <= 300);

-- Preço de atacado fora do alcance da chave pública: o site busca esses
-- valores pelo servidor, e só quando o visitante é um lojista aprovado.
revoke select on table public.store_products from anon, authenticated;
grant select (
  id, category_id, brand, name, slug, sku, description, price, availability,
  is_active, created_at, updated_at, card_price, card_installments, warranty
) on table public.store_products to anon, authenticated;

revoke select on table public.store_product_variants from anon, authenticated;
grant select (
  id, product_id, name, sku, attributes, price, stock_quantity, low_stock_threshold,
  is_active, created_at, updated_at
) on table public.store_product_variants to anon, authenticated;
