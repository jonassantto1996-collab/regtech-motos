-- Resultados do site, mais detalhados e ainda anônimos:
-- de onde veio a visita, aparelho e cidade aproximada (pelo provedor de
-- internet). Nenhum dado pessoal, IP ou cookie é guardado.
alter table public.site_events
  add column if not exists traffic_source text
    check (traffic_source is null or traffic_source in ('instagram', 'facebook', 'google', 'anuncio', 'direto', 'outros')),
  add column if not exists device text
    check (device is null or device in ('celular', 'tablet', 'computador')),
  add column if not exists city text check (city is null or char_length(city) <= 80),
  add column if not exists region text check (region is null or char_length(region) <= 10);

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
  ),
  views as (
    select * from ev where event_type = 'page_view' and session_id is not null
  ),
  -- Uma linha por visita (aba): origem, aparelho e cidade da primeira página.
  visits as (
    select distinct on (session_id)
      session_id, traffic_source, device, city, region, created_at
    from views
    order by session_id, created_at
  ),
  session_flags as (
    select v.session_id,
      bool_or(v.path = '/products' or v.path like '/products/%') as saw_bikes,
      bool_or(v.path like '/products/%') as saw_product
    from views v group by v.session_id
  ),
  session_clicks as (
    select distinct session_id from ev
    where event_type = 'whatsapp_click' and session_id is not null
  )
  select jsonb_build_object(
    'page_views', (select count(*) from ev where event_type = 'page_view'),
    'visits', (select count(*) from visits),
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
    'origins', coalesce((
      select jsonb_agg(jsonb_build_object('origin', o.origin, 'visits', o.visits, 'clicks', o.clicks) order by o.visits desc)
      from (
        select coalesce(vi.traffic_source, 'sem_info') as origin,
               count(*) as visits,
               count(sc.session_id) as clicks
        from visits vi
        left join session_clicks sc on sc.session_id = vi.session_id
        group by 1
      ) o
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(jsonb_build_object('device', d.device, 'visits', d.visits) order by d.visits desc)
      from (
        select coalesce(device, 'sem_info') as device, count(*) as visits
        from visits group by 1
      ) d
    ), '[]'::jsonb),
    'cities', coalesce((
      select jsonb_agg(jsonb_build_object('city', c.city, 'region', c.region, 'visits', c.visits) order by c.visits desc)
      from (
        select city, max(region) as region, count(*) as visits
        from visits where city is not null
        group by city
        order by visits desc
        limit 8
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
      'saw_bikes', (select count(*) from session_flags where saw_bikes),
      'saw_product', (select count(*) from session_flags where saw_product),
      'clicked', (select count(*) from session_clicks)
    ),
    'details_since', (select min(created_at) from public.site_events where device is not null),
    'first_event_at', (select min(created_at) from public.site_events)
  );
$$;

revoke all on function public.admin_site_stats(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_site_stats(timestamptz, timestamptz) to service_role;
