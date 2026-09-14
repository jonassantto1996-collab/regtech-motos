create table public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  whatsapp text not null,
  product_id uuid references public.products (id) on delete set null,
  product_name_snapshot text not null,
  price_snapshot numeric(10,2) not null check (price_snapshot >= 0),
  product_url text,
  status text not null default 'NOVO' check (
    status in ('NOVO', 'EM_ATENDIMENTO', 'INTERESSADO', 'VENDA_REALIZADA', 'NAO_CONVERTIDO')
  ),
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.leads is 'Leads gerados a partir do catálogo. product_id é anulável de propósito: ON DELETE SET NULL preserva o histórico do lead mesmo se o produto for excluído fisicamente.';
comment on column public.leads.product_name_snapshot is 'Nome do produto no momento do interesse — não deve ser recalculado a partir de products.';
comment on column public.leads.price_snapshot is 'Preço do produto no momento do interesse — não deve ser recalculado a partir de products.price.';
comment on column public.leads.status is 'NAO_CONVERTIDO deve ser exibido na interface como "Não convertido".';

create index leads_product_id_idx on public.leads (product_id);
create index leads_status_idx on public.leads (status);
create index leads_created_at_idx on public.leads (created_at);

create trigger set_leads_updated_at
  before update on public.leads
  for each row
  execute function public.set_updated_at();
