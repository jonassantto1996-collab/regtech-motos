-- Categorias da loja de tecnologia (Regtech Cell Shop), definidas pelo Jonas
-- em 29/10/2026. TVs e "Outros produtos" ficam inativas (não apagadas).
update public.store_categories set name='Smartphones', slug='smartphones', sort_order=30, is_active=true where slug='celulares';
update public.store_categories set name='Bombox', slug='bombox', sort_order=50, is_active=true where slug='bombox-audio';
update public.store_categories set sort_order=60, is_active=true where slug='starlink';
update public.store_categories set sort_order=80, is_active=false where slug='tvs';
update public.store_categories set sort_order=90, is_active=false where slug='outros-produtos';
insert into public.store_categories(name,slug,sort_order,is_active) values
 ('iPhone','iphone',10,true),
 ('iPad e Tablets','ipad',20,true),
 ('Carregadores','carregadores',40,true),
 ('Acessórios','acessorios',70,true)
on conflict (slug) do update set name=excluded.name, sort_order=excluded.sort_order, is_active=true;
