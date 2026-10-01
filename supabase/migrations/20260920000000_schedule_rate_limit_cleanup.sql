create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'cleanup-lead-rate-limits-daily',
  '17 3 * * *',
  $$select public.cleanup_lead_rate_limits(24);$$
);
