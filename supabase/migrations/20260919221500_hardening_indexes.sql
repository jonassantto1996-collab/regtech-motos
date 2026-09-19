-- Hardening/performance for public lead intake.
-- Supports the 60-second duplicate/rate-limit lookup without scanning leads.
create index if not exists leads_whatsapp_created_at_idx
  on public.leads (whatsapp, created_at desc);

-- Dashboard commonly groups recent leads by status/date.
create index if not exists leads_status_created_at_idx
  on public.leads (status, created_at desc);
