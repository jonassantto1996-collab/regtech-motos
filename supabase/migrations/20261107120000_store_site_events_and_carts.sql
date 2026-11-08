-- Regtech Cell Shop: movimentação do site (varejo) e carrinhos parados.

-- 1) Eventos anônimos da loja: visita, clique no WhatsApp e "adicionou ao carrinho".
--    Sem dados pessoais: página, origem da visita, aparelho, cidade aproximada e
--    um número aleatório que vale enquanto a aba estiver aberta.
create table if not exists public.store_site_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('page_view', 'whatsapp_click', 'add_to_cart')),
  path text not null check (char_length(path) between 1 and 300),
  product_id uuid references public.store_products(id) on delete set null,
  source text check (source is null or char_length(source) <= 40),
  session_id text check (session_id is null or session_id ~ '^[a-z0-9]{8,40}$'),
  traffic_source text check (traffic_source is null or traffic_source in ('instagram', 'facebook', 'google', 'anuncio', 'direto', 'outros')),
  device text check (device is null or device in ('celular', 'tablet', 'computador')),
  city text check (city is null or char_length(city) <= 80),
  region text check (region is null or char_length(region) <= 10),
  created_at timestamptz not null default now()
);
create index if not exists store_site_events_created_at_idx on public.store_site_events (created_at);
create index if not exists store_site_events_product_idx on public.store_site_events (product_id) where product_id is not null;
alter table public.store_site_events enable row level security;
-- Sem políticas: só o servidor (chave de serviço) grava e lê.
revoke all on public.store_site_events from anon, authenticated;

-- 2) Carrinhos: guardados para o painel mostrar os que ficaram parados.
--    O contato (nome e WhatsApp) só existe quando a pessoa preenche e autoriza.
create table if not exists public.store_carts (
  id uuid primary key default gen_random_uuid(),
  token text not null unique check (token ~ '^[a-z0-9]{24,64}$'),
  mode text not null default 'retail' check (mode in ('retail', 'wholesale')),
  reseller_id uuid references public.store_resellers(id) on delete set null,
  items jsonb not null default '[]'::jsonb,
  item_count integer not null default 0 check (item_count between 0 and 5000),
  total numeric(12, 2) not null default 0 check (total >= 0),
  has_unpriced boolean not null default false,
  contact_name text check (contact_name is null or char_length(btrim(contact_name)) between 2 and 80),
  whatsapp text check (whatsapp is null or whatsapp ~ '^[0-9]{10,11}$'),
  consent_at timestamptz,
  status text not null default 'open' check (status in ('open', 'checked_out', 'contacted', 'won', 'lost')),
  checked_out_at timestamptz,
  status_changed_at timestamptz,
  admin_note text check (admin_note is null or char_length(admin_note) <= 500),
  device text check (device is null or device in ('celular', 'tablet', 'computador')),
  traffic_source text check (traffic_source is null or traffic_source in ('instagram', 'facebook', 'google', 'anuncio', 'direto', 'outros')),
  city text check (city is null or char_length(city) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Contato só com autorização.
  constraint store_carts_contact_consent check (whatsapp is null or consent_at is not null)
);
create index if not exists store_carts_status_updated_idx on public.store_carts (status, updated_at desc);
alter table public.store_carts enable row level security;
revoke all on public.store_carts from anon, authenticated;

-- 3) Resumo da movimentação para o painel (Loja completa → Resultados da loja).
create or replace function public.admin_store_site_stats(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with ev as (
    select * from public.store_site_events
    where created_at >= p_from and created_at < p_to
  ),
  views as (
    select * from ev where event_type = 'page_view' and session_id is not null
  ),
  visits as (
    select distinct on (session_id) session_id, traffic_source, device, city, region, created_at
    from views
    order by session_id, created_at
  ),
  session_flags as (
    select session_id,
      bool_or(path ~ '/produto/') as saw_product
    from views group by session_id
  ),
  session_cart as (
    select distinct session_id from ev where event_type = 'add_to_cart' and session_id is not null
  ),
  session_clicks as (
    select distinct session_id from ev where event_type = 'whatsapp_click' and session_id is not null
  )
  select jsonb_build_object(
    'page_views', (select count(*) from ev where event_type = 'page_view'),
    'visits', (select count(*) from visits),
    'whatsapp_clicks', (select count(*) from ev where event_type = 'whatsapp_click'),
    'add_to_cart', (select count(*) from ev where event_type = 'add_to_cart'),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'views', d.views, 'clicks', d.clicks) order by d.day)
      from (
        select (created_at at time zone 'America/Belem')::date as day,
               count(*) filter (where event_type = 'page_view') as views,
               count(*) filter (where event_type = 'whatsapp_click') as clicks
        from ev group by 1
      ) d
    ), '[]'::jsonb),
    'products', coalesce((
      select jsonb_agg(jsonb_build_object('id', x.id, 'brand', x.brand, 'name', x.name, 'slug', x.slug,
                                          'views', x.views, 'carts', x.carts, 'clicks', x.clicks)
                       order by x.views desc, x.carts desc, x.clicks desc, x.name)
      from (
        select p.id, p.brand, p.name, p.slug,
               count(*) filter (where e.event_type = 'page_view') as views,
               count(*) filter (where e.event_type = 'add_to_cart') as carts,
               count(*) filter (where e.event_type = 'whatsapp_click') as clicks
        from ev e
        join public.store_products p on p.id = e.product_id
        group by p.id, p.brand, p.name, p.slug
        order by views desc, carts desc, clicks desc, p.name
        limit 20
      ) x
    ), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(jsonb_build_object('source', s.source, 'clicks', s.clicks) order by s.clicks desc)
      from (
        select coalesce(source, 'outros') as source, count(*) as clicks
        from ev where event_type = 'whatsapp_click' group by 1
      ) s
    ), '[]'::jsonb),
    'origins', coalesce((
      select jsonb_agg(jsonb_build_object('origin', o.origin, 'visits', o.visits, 'clicks', o.clicks) order by o.visits desc)
      from (
        select coalesce(vi.traffic_source, 'sem_info') as origin, count(*) as visits, count(sc.session_id) as clicks
        from visits vi left join session_clicks sc on sc.session_id = vi.session_id
        group by 1
      ) o
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(jsonb_build_object('device', d.device, 'visits', d.visits) order by d.visits desc)
      from (select coalesce(device, 'sem_info') as device, count(*) as visits from visits group by 1) d
    ), '[]'::jsonb),
    'cities', coalesce((
      select jsonb_agg(jsonb_build_object('city', c.city, 'region', c.region, 'visits', c.visits) order by c.visits desc)
      from (
        select city, max(region) as region, count(*) as visits
        from visits where city is not null group by city order by visits desc limit 8
      ) c
    ), '[]'::jsonb),
    'hours', coalesce((
      select jsonb_agg(jsonb_build_object('hour', h.hour, 'visits', h.visits) order by h.hour)
      from (
        select extract(hour from created_at at time zone 'America/Belem')::int as hour, count(*) as visits
        from visits group by 1
      ) h
    ), '[]'::jsonb),
    'funnel', jsonb_build_object(
      'visits', (select count(*) from visits),
      'saw_product', (select count(*) from session_flags where saw_product),
      'added_to_cart', (select count(*) from session_cart),
      'clicked', (select count(*) from session_clicks)
    ),
    'first_event_at', (select min(created_at) from public.store_site_events)
  );
$$;
revoke all on function public.admin_store_site_stats(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_store_site_stats(timestamptz, timestamptz) to service_role;
