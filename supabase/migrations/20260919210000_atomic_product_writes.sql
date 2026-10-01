-- Atomic product create/update. Only service_role may execute.
create or replace function public.admin_create_product_atomic(p_product jsonb,p_colors jsonb,p_specs jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_color jsonb; v_spec jsonb;
begin
 insert into products(brand,model,slug,sku,category,description,price,availability,warranty,pickup_available,is_active)
 values(p_product->>'brand',p_product->>'model',p_product->>'slug',nullif(p_product->>'sku',''),p_product->>'category',p_product->>'description',(p_product->>'price')::numeric,p_product->>'availability',p_product->>'warranty',coalesce((p_product->>'pickup_available')::boolean,false),coalesce((p_product->>'is_active')::boolean,false)) returning id into v_id;
 for v_color in select value from jsonb_array_elements(coalesce(p_colors,'[]'::jsonb)) loop insert into product_colors(product_id,color) values(v_id,v_color#>>'{}'); end loop;
 for v_spec in select value from jsonb_array_elements(coalesce(p_specs,'[]'::jsonb)) loop insert into product_specs(product_id,spec_key,spec_value) values(v_id,v_spec->>'key',v_spec->>'value'); end loop;
 return v_id;
end; $$;
create or replace function public.admin_update_product_atomic(p_id uuid,p_product jsonb,p_colors jsonb,p_specs jsonb) returns void language plpgsql security definer set search_path=public as $$
declare v_color jsonb; v_spec jsonb;
begin
 update products set brand=p_product->>'brand',model=p_product->>'model',slug=p_product->>'slug',sku=nullif(p_product->>'sku',''),category=p_product->>'category',description=p_product->>'description',price=(p_product->>'price')::numeric,availability=p_product->>'availability',warranty=p_product->>'warranty',pickup_available=coalesce((p_product->>'pickup_available')::boolean,false),is_active=coalesce((p_product->>'is_active')::boolean,false) where id=p_id;
 if not found then raise exception 'product_not_found'; end if;
 delete from product_colors where product_id=p_id;
 for v_color in select value from jsonb_array_elements(coalesce(p_colors,'[]'::jsonb)) loop insert into product_colors(product_id,color) values(p_id,v_color#>>'{}'); end loop;
 delete from product_specs where product_id=p_id;
 for v_spec in select value from jsonb_array_elements(coalesce(p_specs,'[]'::jsonb)) loop insert into product_specs(product_id,spec_key,spec_value) values(p_id,v_spec->>'key',v_spec->>'value'); end loop;
end; $$;
revoke all on function public.admin_create_product_atomic(jsonb,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.admin_update_product_atomic(uuid,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.admin_create_product_atomic(jsonb,jsonb,jsonb) to service_role;
grant execute on function public.admin_update_product_atomic(uuid,jsonb,jsonb,jsonb) to service_role;