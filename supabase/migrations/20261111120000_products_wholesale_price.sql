-- Preço de atacado das motos: só o painel usa (catálogo em PDF para lojistas).
-- A coluna NÃO é liberada para a chave pública (anon/authenticated): o site não mostra.
alter table public.products add column if not exists wholesale_price numeric(12,2)
  check (wholesale_price is null or wholesale_price >= 0);
comment on column public.products.wholesale_price is 'Preço de atacado (só aparece no catálogo de atacado gerado no painel).';

create or replace function public.admin_create_product_atomic(p_product jsonb, p_colors jsonb, p_specs jsonb)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_id uuid; v_color jsonb; v_spec jsonb;
begin
 insert into products(brand,model,slug,sku,category,description,price,card_price,card_installments,wholesale_price,availability,warranty,pickup_available,is_active)
 values(p_product->>'brand',p_product->>'model',p_product->>'slug',nullif(p_product->>'sku',''),p_product->>'category',p_product->>'description',(p_product->>'price')::numeric,nullif(p_product->>'card_price','')::numeric,nullif(p_product->>'card_installments','')::smallint,nullif(p_product->>'wholesale_price','')::numeric,p_product->>'availability',p_product->>'warranty',coalesce((p_product->>'pickup_available')::boolean,false),coalesce((p_product->>'is_active')::boolean,false)) returning id into v_id;
 for v_color in select value from jsonb_array_elements(coalesce(p_colors,'[]'::jsonb)) loop insert into product_colors(product_id,color) values(v_id,v_color#>>'{}'); end loop;
 for v_spec in select value from jsonb_array_elements(coalesce(p_specs,'[]'::jsonb)) loop insert into product_specs(product_id,spec_key,spec_value) values(v_id,v_spec->>'key',v_spec->>'value'); end loop;
 return v_id;
end; $function$;

-- O atacado só muda quando o formulário manda o campo (versões antigas do painel não apagam o valor).
create or replace function public.admin_update_product_atomic(p_id uuid, p_product jsonb, p_colors jsonb, p_specs jsonb)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_color jsonb; v_spec jsonb;
begin
 update products set brand=p_product->>'brand',model=p_product->>'model',slug=p_product->>'slug',sku=nullif(p_product->>'sku',''),category=p_product->>'category',description=p_product->>'description',price=(p_product->>'price')::numeric,card_price=nullif(p_product->>'card_price','')::numeric,card_installments=nullif(p_product->>'card_installments','')::smallint,
  wholesale_price=case when p_product ? 'wholesale_price' then nullif(p_product->>'wholesale_price','')::numeric else wholesale_price end,
  availability=p_product->>'availability',warranty=p_product->>'warranty',pickup_available=coalesce((p_product->>'pickup_available')::boolean,false),is_active=coalesce((p_product->>'is_active')::boolean,false) where id=p_id;
 if not found then raise exception 'product_not_found'; end if;
 delete from product_colors where product_id=p_id;
 for v_color in select value from jsonb_array_elements(coalesce(p_colors,'[]'::jsonb)) loop insert into product_colors(product_id,color) values(p_id,v_color#>>'{}'); end loop;
 delete from product_specs where product_id=p_id;
 for v_spec in select value from jsonb_array_elements(coalesce(p_specs,'[]'::jsonb)) loop insert into product_specs(product_id,spec_key,spec_value) values(p_id,v_spec->>'key',v_spec->>'value'); end loop;
end; $function$;
