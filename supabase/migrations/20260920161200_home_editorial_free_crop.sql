alter table public.home_editorial_settings
  add column if not exists image_position_x integer not null default 50
    check (image_position_x between 0 and 100),
  add column if not exists image_position_y integer not null default 50
    check (image_position_y between 0 and 100);
