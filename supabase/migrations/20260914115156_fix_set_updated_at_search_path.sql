-- Corrige alerta de segurança do linter do Supabase (function_search_path_mutable):
-- funções sem search_path fixo são vulneráveis a sequestro de search_path.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
