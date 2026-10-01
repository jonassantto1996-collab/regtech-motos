insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('home-media','home-media',true,15728640,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "Public can read home media"
on storage.objects for select to anon,authenticated
using (bucket_id='home-media');

create table public.home_editorial_settings (
  id boolean primary key default true check (id=true),
  eyebrow text not null default 'Mobilidade elétrica' check (length(trim(eyebrow)) between 1 and 80),
  title text not null default 'Uma nova experiência para se movimentar.' check (length(trim(title)) between 1 and 180),
  description text not null default 'Explore os modelos elétricos disponíveis, conheça os detalhes de cada moto e escolha qual deseja consultar com a equipe Regtech.' check (length(trim(description)) between 1 and 500),
  cta_label text not null default 'Comparar modelos' check (length(trim(cta_label)) between 1 and 60),
  cta_href text not null default '/products' check (length(trim(cta_href)) between 1 and 300),
  storage_path text,
  alt_text text not null default 'Entrega de uma moto elétrica a cliente na Regtech Motors' check (length(trim(alt_text)) between 1 and 180),
  image_position text not null default 'center' check (image_position in ('left','center','right')),
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.home_editorial_settings enable row level security;
grant select on table public.home_editorial_settings to anon,authenticated,service_role;
grant insert,update,delete on table public.home_editorial_settings to service_role;

create policy "Public can read active home editorial settings"
on public.home_editorial_settings for select to anon,authenticated
using (is_active=true);

insert into public.home_editorial_settings(id) values(true) on conflict(id) do nothing;

create trigger set_home_editorial_settings_updated_at
before update on public.home_editorial_settings
for each row execute function public.set_updated_at();
