create or replace function public.adjust_moto_inventory_stock(
  p_product_id uuid,
  p_color text,
  p_new_quantity integer,
  p_actor_user_id uuid,
  p_note text default null
)
returns table (
  inventory_id uuid,
  movement_id uuid,
  previous_quantity integer,
  current_quantity integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_color text;
  v_inventory_id uuid;
  v_before integer;
  v_movement_id uuid;
begin
  if p_product_id is null then raise exception 'product_required'; end if;
  v_color := nullif(trim(coalesce(p_color,'')), '');
  if v_color is null or length(v_color) > 80 then raise exception 'invalid_color'; end if;
  if p_new_quantity is null or p_new_quantity < 0 then raise exception 'invalid_quantity'; end if;
  if p_note is not null and length(p_note) > 200 then raise exception 'note_too_long'; end if;

  perform 1 from public.products where id = p_product_id;
  if not found then raise exception 'product_not_found'; end if;

  insert into public.moto_inventory(product_id,color,stock_quantity,low_stock_threshold)
  values(p_product_id,v_color,0,1)
  on conflict(product_id,color) do nothing;

  select id,stock_quantity into v_inventory_id,v_before
  from public.moto_inventory
  where product_id=p_product_id and color=v_color
  for update;

  update public.moto_inventory
  set stock_quantity=p_new_quantity,updated_at=now()
  where id=v_inventory_id;

  insert into public.moto_inventory_movements(
    product_id,inventory_id,movement_type,quantity_before,quantity_after,color,note,actor_user_id
  ) values(
    p_product_id,v_inventory_id,'ADJUSTMENT',v_before,p_new_quantity,v_color,
    nullif(trim(coalesce(p_note,'')),''),p_actor_user_id
  )
  returning id into v_movement_id;

  return query select v_inventory_id,v_movement_id,v_before,p_new_quantity;
end;
$$;

revoke all on function public.adjust_moto_inventory_stock(uuid,text,integer,uuid,text) from public,anon,authenticated;
grant execute on function public.adjust_moto_inventory_stock(uuid,text,integer,uuid,text) to service_role;
