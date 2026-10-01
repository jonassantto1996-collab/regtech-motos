create table public.purchase_invoices (
  id uuid primary key default gen_random_uuid(),
  access_key text not null unique check (access_key ~ '^[0-9]{44}$'),
  invoice_number text not null check (length(trim(invoice_number)) between 1 and 30),
  series text,
  issuer_cnpj text not null check (issuer_cnpj ~ '^[0-9]{14}$'),
  issuer_name text not null check (length(trim(issuer_name)) between 1 and 200),
  issued_at timestamptz,
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  item_count integer not null default 0 check (item_count >= 0),
  status text not null default 'REVIEW' check (status in ('REVIEW','PARTIAL','COMPLETED','CANCELLED')),
  xml_hash text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purchase_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.purchase_invoices(id) on delete cascade,
  line_number integer not null check (line_number > 0),
  supplier_code text,
  ean text,
  description text not null check (length(trim(description)) between 1 and 500),
  ncm text,
  cfop text,
  unit text,
  quantity numeric(14,4) not null check (quantity > 0),
  unit_value numeric(14,4) not null default 0 check (unit_value >= 0),
  total_value numeric(14,2) not null default 0 check (total_value >= 0),
  target_type text check (target_type is null or target_type in ('STORE_VARIANT','MOTO_PRODUCT','IGNORE')),
  target_id uuid,
  target_color text check (target_color is null or length(target_color) <= 80),
  status text not null default 'PENDING' check (status in ('PENDING','APPLIED','IGNORED')),
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  unique(invoice_id,line_number)
);

create index purchase_invoice_items_invoice_status_idx on public.purchase_invoice_items(invoice_id,status);
create index purchase_invoice_items_ean_idx on public.purchase_invoice_items(ean) where ean is not null;
create index purchase_invoice_items_supplier_code_idx on public.purchase_invoice_items(supplier_code) where supplier_code is not null;
create index purchase_invoices_created_at_idx on public.purchase_invoices(created_at desc);

create table public.purchase_item_mappings (
  id uuid primary key default gen_random_uuid(),
  supplier_cnpj text not null check (supplier_cnpj ~ '^[0-9]{14}$'),
  source_key text not null check (length(source_key) between 3 and 180),
  target_type text not null check (target_type in ('STORE_VARIANT','MOTO_PRODUCT')),
  target_id uuid not null,
  target_color text check (target_color is null or length(target_color) <= 80),
  updated_at timestamptz not null default now(),
  unique(supplier_cnpj,source_key)
);

create table public.moto_inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color text not null check (length(trim(color)) between 1 and 80),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 1 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now(),
  unique(product_id,color)
);

create table public.moto_inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  inventory_id uuid not null references public.moto_inventory(id) on delete cascade,
  invoice_item_id uuid references public.purchase_invoice_items(id) on delete set null,
  movement_type text not null check (movement_type in ('NFE_ENTRY','ADJUSTMENT')),
  quantity_before integer not null check (quantity_before >= 0),
  quantity_after integer not null check (quantity_after >= 0),
  delta integer generated always as (quantity_after - quantity_before) stored,
  color text not null,
  note text check (note is null or length(note) <= 200),
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index moto_inventory_product_idx on public.moto_inventory(product_id);
create index moto_inventory_movements_product_created_idx on public.moto_inventory_movements(product_id,created_at desc);

alter table public.purchase_invoices enable row level security;
alter table public.purchase_invoice_items enable row level security;
alter table public.purchase_item_mappings enable row level security;
alter table public.moto_inventory enable row level security;
alter table public.moto_inventory_movements enable row level security;

revoke all on table public.purchase_invoices from anon,authenticated;
revoke all on table public.purchase_invoice_items from anon,authenticated;
revoke all on table public.purchase_item_mappings from anon,authenticated;
revoke all on table public.moto_inventory from anon,authenticated;
revoke all on table public.moto_inventory_movements from anon,authenticated;

grant select,insert,update,delete on table public.purchase_invoices to service_role;
grant select,insert,update,delete on table public.purchase_invoice_items to service_role;
grant select,insert,update,delete on table public.purchase_item_mappings to service_role;
grant select,insert,update,delete on table public.moto_inventory to service_role;
grant select,insert on table public.moto_inventory_movements to service_role;

alter table public.store_inventory_movements
  drop constraint if exists store_inventory_movements_movement_type_check;
alter table public.store_inventory_movements
  add constraint store_inventory_movements_movement_type_check
  check (movement_type in ('INITIAL','ADJUSTMENT','NFE_ENTRY'));
alter table public.store_inventory_movements
  add column if not exists invoice_item_id uuid references public.purchase_invoice_items(id) on delete set null;

create or replace function public.apply_purchase_invoice_item(
  p_item_id uuid,
  p_target_type text,
  p_target_id uuid,
  p_target_color text,
  p_actor_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.purchase_invoice_items%rowtype;
  v_invoice public.purchase_invoices%rowtype;
  v_qty integer;
  v_before integer;
  v_after integer;
  v_product_id uuid;
  v_inventory_id uuid;
  v_color text;
  v_source_key text;
  v_pending integer;
begin
  if p_target_type not in ('STORE_VARIANT','MOTO_PRODUCT','IGNORE') then
    raise exception 'invalid_target_type';
  end if;

  select * into v_item from public.purchase_invoice_items where id=p_item_id for update;
  if not found then raise exception 'invoice_item_not_found'; end if;
  if v_item.status <> 'PENDING' then raise exception 'invoice_item_already_processed'; end if;

  select * into v_invoice from public.purchase_invoices where id=v_item.invoice_id for update;

  if p_target_type='IGNORE' then
    update public.purchase_invoice_items
    set target_type='IGNORE',target_id=null,target_color=null,status='IGNORED',applied_at=now()
    where id=p_item_id;
  else
    if v_item.quantity <> trunc(v_item.quantity) or v_item.quantity <= 0 then
      raise exception 'non_integer_quantity';
    end if;
    v_qty:=v_item.quantity::integer;

    if p_target_type='STORE_VARIANT' then
      select product_id,stock_quantity into v_product_id,v_before
      from public.store_product_variants
      where id=p_target_id and is_active=true
      for update;
      if not found then raise exception 'store_variant_not_found'; end if;

      v_after:=v_before+v_qty;
      update public.store_product_variants set stock_quantity=v_after,updated_at=now() where id=p_target_id;

      insert into public.store_inventory_movements(
        variant_id,product_id,movement_type,quantity_before,quantity_after,note,actor_user_id,invoice_item_id
      ) values(
        p_target_id,v_product_id,'NFE_ENTRY',v_before,v_after,'Entrada NF-e '||v_invoice.invoice_number,p_actor_user_id,p_item_id
      );

      update public.purchase_invoice_items
      set target_type='STORE_VARIANT',target_id=p_target_id,target_color=null,status='APPLIED',applied_at=now()
      where id=p_item_id;
    elsif p_target_type='MOTO_PRODUCT' then
      perform 1 from public.products where id=p_target_id and is_active=true;
      if not found then raise exception 'moto_product_not_found'; end if;

      v_color:=coalesce(nullif(trim(p_target_color),''),'Não informada');

      insert into public.product_colors(product_id,color)
      values(p_target_id,v_color)
      on conflict(product_id,color) do nothing;

      insert into public.moto_inventory(product_id,color,stock_quantity)
      values(p_target_id,v_color,0)
      on conflict(product_id,color) do nothing;

      select id,stock_quantity into v_inventory_id,v_before
      from public.moto_inventory
      where product_id=p_target_id and color=v_color
      for update;

      v_after:=v_before+v_qty;
      update public.moto_inventory set stock_quantity=v_after,updated_at=now() where id=v_inventory_id;

      insert into public.moto_inventory_movements(
        product_id,inventory_id,invoice_item_id,movement_type,quantity_before,quantity_after,color,note,actor_user_id
      ) values(
        p_target_id,v_inventory_id,p_item_id,'NFE_ENTRY',v_before,v_after,v_color,'Entrada NF-e '||v_invoice.invoice_number,p_actor_user_id
      );

      update public.purchase_invoice_items
      set target_type='MOTO_PRODUCT',target_id=p_target_id,target_color=v_color,status='APPLIED',applied_at=now()
      where id=p_item_id;
    end if;

    v_source_key:=case
      when nullif(trim(v_item.ean),'') is not null and upper(trim(v_item.ean)) not in ('SEM GTIN','SEM-GTIN') then 'EAN:'||trim(v_item.ean)
      when nullif(trim(v_item.supplier_code),'') is not null then 'CODE:'||trim(v_item.supplier_code)
      else null
    end;

    if v_source_key is not null then
      insert into public.purchase_item_mappings(
        supplier_cnpj,source_key,target_type,target_id,target_color,updated_at
      ) values(
        v_invoice.issuer_cnpj,v_source_key,p_target_type,p_target_id,
        case when p_target_type='MOTO_PRODUCT' then v_color else null end,now()
      )
      on conflict(supplier_cnpj,source_key)
      do update set target_type=excluded.target_type,target_id=excluded.target_id,target_color=excluded.target_color,updated_at=now();
    end if;
  end if;

  select count(*) into v_pending from public.purchase_invoice_items
  where invoice_id=v_item.invoice_id and status='PENDING';

  update public.purchase_invoices
  set status=case when v_pending=0 then 'COMPLETED' else 'PARTIAL' end,updated_at=now()
  where id=v_item.invoice_id;

  return jsonb_build_object('invoice_id',v_item.invoice_id,'item_id',p_item_id,'status',
    case when p_target_type='IGNORE' then 'IGNORED' else 'APPLIED' end,'quantity',v_item.quantity);
end;
$$;

revoke all on function public.apply_purchase_invoice_item(uuid,text,uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.apply_purchase_invoice_item(uuid,text,uuid,text,uuid) to service_role;
