create table public.store_inventory_movements (
 id uuid primary key default gen_random_uuid(),
 variant_id uuid not null references public.store_product_variants(id) on delete cascade,
 product_id uuid not null references public.store_products(id) on delete cascade,
 movement_type text not null check (movement_type in ('INITIAL','ADJUSTMENT')),
 quantity_before integer not null check (quantity_before >= 0),
 quantity_after integer not null check (quantity_after >= 0),
 delta integer generated always as (quantity_after - quantity_before) stored,
 note text check (note is null or length(note) <= 200),
 actor_user_id uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);
create index store_inventory_movements_variant_created_idx on public.store_inventory_movements(variant_id, created_at desc);
create index store_inventory_movements_product_created_idx on public.store_inventory_movements(product_id, created_at desc);
alter table public.store_inventory_movements enable row level security;
revoke all on table public.store_inventory_movements from anon, authenticated;
grant select on table public.store_inventory_movements to service_role;

create or replace function public.record_store_initial_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
 if new.stock_quantity > 0 then
  insert into public.store_inventory_movements(variant_id,product_id,movement_type,quantity_before,quantity_after,note)
  values(new.id,new.product_id,'INITIAL',0,new.stock_quantity,'Estoque inicial');
 end if;
 return new;
end;
$$;
revoke all on function public.record_store_initial_stock() from public, anon, authenticated;

create trigger store_variant_initial_stock_movement
after insert on public.store_product_variants
for each row execute function public.record_store_initial_stock();

create or replace function public.adjust_store_variant_stock(
 p_product_id uuid,
 p_variant_id uuid,
 p_new_quantity integer,
 p_actor_user_id uuid,
 p_note text default null
)
returns table(previous_quantity integer,current_quantity integer,movement_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
 v_before integer;
 v_movement uuid;
begin
 if p_new_quantity is null or p_new_quantity < 0 then
  raise exception 'invalid_stock';
 end if;
 if p_note is not null and length(p_note) > 200 then
  raise exception 'note_too_long';
 end if;
 select stock_quantity into v_before
 from public.store_product_variants
 where id=p_variant_id and product_id=p_product_id
 for update;
 if not found then
  raise exception 'variant_not_found';
 end if;
 if v_before = p_new_quantity then
  return query select v_before,p_new_quantity,null::uuid;
  return;
 end if;
 update public.store_product_variants
 set stock_quantity=p_new_quantity,updated_at=now()
 where id=p_variant_id and product_id=p_product_id;
 insert into public.store_inventory_movements(
  variant_id,product_id,movement_type,quantity_before,quantity_after,note,actor_user_id
 ) values(
  p_variant_id,p_product_id,'ADJUSTMENT',v_before,p_new_quantity,nullif(trim(p_note),''),p_actor_user_id
 ) returning id into v_movement;
 return query select v_before,p_new_quantity,v_movement;
end;
$$;
revoke all on function public.adjust_store_variant_stock(uuid,uuid,integer,uuid,text) from public, anon, authenticated;
grant execute on function public.adjust_store_variant_stock(uuid,uuid,integer,uuid,text) to service_role;