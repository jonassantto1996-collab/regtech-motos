alter table public.home_editorial_settings
  add column if not exists image_width integer check (image_width is null or image_width > 0),
  add column if not exists image_height integer check (image_height is null or image_height > 0);
