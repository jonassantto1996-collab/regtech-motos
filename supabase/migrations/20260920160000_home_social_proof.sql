create table public.home_social_proof (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (length(trim(customer_name)) between 1 and 100),
  city text check (city is null or length(trim(city)) <= 100),
  product_name text check (product_name is null or length(trim(product_name)) <= 120),
  testimonial text check (testimonial is null or length(trim(testimonial)) <= 400),
  storage_path text not null unique check (length(trim(storage_path)) between 1 and 500),
  alt_text text not null check (length(trim(alt_text)) between 1 and 180),
  sort_order integer not null default 0 check (sort_order between 0 and 999),
  is_active boolean not null default false,
  publication_authorized boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index home_social_proof_public_idx
  on public.home_social_proof(is_active,publication_authorized,sort_order,created_at desc);

alter table public.home_social_proof enable row level security;

grant select on table public.home_social_proof to anon,authenticated,service_role;
grant insert,update,delete on table public.home_social_proof to service_role;

create policy "Public can read active authorized social proof"
on public.home_social_proof
for select
to anon,authenticated
using (is_active=true and publication_authorized=true);

create trigger set_home_social_proof_updated_at
before update on public.home_social_proof
for each row execute function public.set_updated_at();
