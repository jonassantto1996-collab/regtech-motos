alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_specs enable row level security;
alter table public.leads enable row level security;

-- Catálogo: leitura pública restrita a produtos ativos.
-- Nenhuma policy de INSERT/UPDATE/DELETE é criada para anon/authenticated:
-- ainda não existe autenticação administrativa, então escrita só é possível via service_role.

create policy "Public can view active products"
  on public.products
  for select
  to anon, authenticated
  using (is_active = true);

create policy "Public can view images of active products"
  on public.product_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and p.is_active = true
    )
  );

create policy "Public can view colors of active products"
  on public.product_colors
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_colors.product_id
        and p.is_active = true
    )
  );

create policy "Public can view specs of active products"
  on public.product_specs
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_specs.product_id
        and p.is_active = true
    )
  );

-- Leads: qualquer visitante pode criar um lead (é o propósito da tabela),
-- desde que o status inicial seja NOVO. Nenhuma policy de SELECT/UPDATE/DELETE
-- é criada para anon/authenticated: leitura, alteração e exclusão ficam restritas
-- a quem acessa via service_role (painel admin, quando existir).

create policy "Public can create leads"
  on public.leads
  for insert
  to anon, authenticated
  with check (status = 'NOVO');
