create or replace function public.get_store_admin_overview(p_alert_limit integer default 4)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
 v_limit integer := greatest(1, least(coalesce(p_alert_limit, 4), 20));
begin
 return jsonb_build_object(
  'metrics', jsonb_build_object(
   'total_stock', coalesce((select sum(stock_quantity) from public.store_product_variants where is_active),0),
   'low_stock', (select count(*) from public.store_product_variants where is_active and stock_quantity > 0 and stock_quantity <= low_stock_threshold),
   'out_of_stock', (select count(*) from public.store_product_variants where is_active and stock_quantity = 0),
   'products_without_variants', (
    select count(*) from public.store_products p
    where p.is_active and not exists (
     select 1 from public.store_product_variants v where v.product_id=p.id and v.is_active
    )
   )
  ),
  'category_counts', coalesce((
   select jsonb_object_agg(category_id::text, product_count)
   from (
    select category_id, count(*)::integer as product_count
    from public.store_products
    group by category_id
   ) c
  ), '{}'::jsonb),
  'alerts', jsonb_build_object(
   'out_of_stock', coalesce((
    select jsonb_agg(to_jsonb(x)) from (
     select v.id,v.product_id,v.name,v.sku,v.stock_quantity,v.low_stock_threshold,p.brand,p.name as product_name
     from public.store_product_variants v
     join public.store_products p on p.id=v.product_id
     where v.is_active and p.is_active and v.stock_quantity=0
     order by v.updated_at desc
     limit v_limit
    ) x
   ), '[]'::jsonb),
   'low_stock', coalesce((
    select jsonb_agg(to_jsonb(x)) from (
     select v.id,v.product_id,v.name,v.sku,v.stock_quantity,v.low_stock_threshold,p.brand,p.name as product_name
     from public.store_product_variants v
     join public.store_products p on p.id=v.product_id
     where v.is_active and p.is_active and v.stock_quantity>0 and v.stock_quantity<=v.low_stock_threshold
     order by v.stock_quantity asc,v.updated_at desc
     limit v_limit
    ) x
   ), '[]'::jsonb),
   'without_variants', coalesce((
    select jsonb_agg(to_jsonb(x)) from (
     select p.id,p.brand,p.name
     from public.store_products p
     where p.is_active and not exists (
      select 1 from public.store_product_variants v where v.product_id=p.id and v.is_active
     )
     order by p.created_at desc
     limit v_limit
    ) x
   ), '[]'::jsonb)
  )
 );
end;
$$;
revoke all on function public.get_store_admin_overview(integer) from public, anon, authenticated;
grant execute on function public.get_store_admin_overview(integer) to service_role;
