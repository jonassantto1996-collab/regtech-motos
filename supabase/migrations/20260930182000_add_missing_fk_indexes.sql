create index if not exists admin_audit_log_admin_user_id_idx
  on public.admin_audit_log (admin_user_id);

create index if not exists home_hero_settings_product_id_idx
  on public.home_hero_settings (product_id);

create index if not exists moto_inventory_movements_actor_user_id_idx
  on public.moto_inventory_movements (actor_user_id);

create index if not exists moto_inventory_movements_inventory_id_idx
  on public.moto_inventory_movements (inventory_id);

create index if not exists moto_inventory_movements_invoice_item_id_idx
  on public.moto_inventory_movements (invoice_item_id);

create index if not exists purchase_invoices_created_by_idx
  on public.purchase_invoices (created_by);

create index if not exists store_inventory_movements_actor_user_id_idx
  on public.store_inventory_movements (actor_user_id);

create index if not exists store_inventory_movements_invoice_item_id_idx
  on public.store_inventory_movements (invoice_item_id);
