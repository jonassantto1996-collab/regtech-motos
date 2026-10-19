-- Contagem anônima de visitas e de cliques no WhatsApp do site público.
-- Não guarda nome, telefone, IP nem cookie: só o tipo do evento, a página,
-- a moto (quando houver), a origem do clique e um identificador aleatório
-- da aba do navegador (para contar visitas sem repetir a mesma pessoa).
create table if not exists public.site_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('page_view', 'whatsapp_click')),
  path text not null check (char_length(path) between 1 and 300),
  product_id uuid references public.products (id) on delete set null,
  source text check (source is null or char_length(source) <= 40),
  session_id text check (session_id is null or session_id ~ '^[a-z0-9]{8,40}$'),
  created_at timestamptz not null default now()
);

create index if not exists site_events_created_at_idx
  on public.site_events (created_at desc);
create index if not exists site_events_product_idx
  on public.site_events (product_id, created_at desc)
  where product_id is not null;

-- Só o servidor (service_role) grava e lê. Nada é exposto ao público.
alter table public.site_events enable row level security;
revoke all on table public.site_events from anon, authenticated;
grant select, insert on table public.site_events to service_role;

-- Resumo do período para a página "Resultados" do painel.
create or replace function public.admin_site_stats(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with ev as (
    select * from public.site_events
    where created_at >= p_from and created_at < p_to
  )
  select jsonb_build_object(
    'page_views', (select count(*) from ev where event_type = 'page_view'),
    'visits', (select count(distinct session_id) from ev where event_type = 'page_view' and session_id is not null),
    'whatsapp_clicks', (select count(*) from ev where event_type = 'whatsapp_click'),
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
      select jsonb_agg(jsonb_build_object('id', x.id, 'brand', x.brand, 'model', x.model, 'slug', x.slug, 'views', x.views, 'clicks', x.clicks) order by x.views desc, x.clicks desc, x.model)
      from (
        select p.id, p.brand, p.model, p.slug,
               count(*) filter (where e.event_type = 'page_view') as views,
               count(*) filter (where e.event_type = 'whatsapp_click') as clicks
        from ev e
        join public.products p on p.id = e.product_id
        group by p.id, p.brand, p.model, p.slug
        order by views desc, clicks desc, p.model
        limit 20
      ) x
    ), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(jsonb_build_object('source', s.source, 'clicks', s.clicks) order by s.clicks desc)
      from (
        select coalesce(source, 'outros') as source, count(*) as clicks
        from ev where event_type = 'whatsapp_click'
        group by 1
      ) s
    ), '[]'::jsonb),
    'first_event_at', (select min(created_at) from public.site_events)
  );
$$;

revoke all on function public.admin_site_stats(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_site_stats(timestamptz, timestamptz) to service_role;
