-- Painel de resultados: o WhatsApp passa a contar PESSOAS (uma por visita), não toques.
-- Antes, quem tocava 3 vezes no botão contava 3. Agora:
--   whatsapp_people  = pessoas que abriram o WhatsApp pelo site
--   whatsapp_clicks  = toques no botão (fica para referência)
--   daily.people     = pessoas por dia
--   products/sources = pessoas por produto e por botão

create or replace function public.admin_store_site_stats(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
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
    'whatsapp_people', (select count(*) from session_clicks),
    'add_to_cart', (select count(*) from ev where event_type = 'add_to_cart'),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'views', d.views, 'clicks', d.clicks, 'people', d.people) order by d.day)
      from (
        select (created_at at time zone 'America/Belem')::date as day,
               count(*) filter (where event_type = 'page_view') as views,
               count(*) filter (where event_type = 'whatsapp_click') as clicks,
               count(distinct session_id) filter (where event_type = 'whatsapp_click') as people
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
               count(distinct e.session_id) filter (where e.event_type = 'whatsapp_click') as clicks
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
        select coalesce(source, 'outros') as source, count(distinct session_id) as clicks
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
$function$;

create or replace function public.admin_site_stats(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  with ev as (
    select * from public.site_events
    where created_at >= p_from and created_at < p_to
  ),
  views as (
    select * from ev where event_type = 'page_view' and session_id is not null
  ),
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
    'whatsapp_people', (select count(*) from session_clicks),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'views', d.views, 'clicks', d.clicks, 'people', d.people) order by d.day)
      from (
        select (created_at at time zone 'America/Belem')::date as day,
               count(*) filter (where event_type = 'page_view') as views,
               count(*) filter (where event_type = 'whatsapp_click') as clicks,
               count(distinct session_id) filter (where event_type = 'whatsapp_click') as people
        from ev group by 1
      ) d
    ), '[]'::jsonb),
    'products', coalesce((
      select jsonb_agg(jsonb_build_object('id', x.id, 'brand', x.brand, 'model', x.model, 'slug', x.slug, 'views', x.views, 'clicks', x.clicks) order by x.views desc, x.clicks desc, x.model)
      from (
        select p.id, p.brand, p.model, p.slug,
               count(*) filter (where e.event_type = 'page_view') as views,
               count(distinct e.session_id) filter (where e.event_type = 'whatsapp_click') as clicks
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
        select coalesce(source, 'outros') as source, count(distinct session_id) as clicks
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
$function$;
