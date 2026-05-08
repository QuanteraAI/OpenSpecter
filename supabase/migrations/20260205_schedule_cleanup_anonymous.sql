-- Schedule the cleanup-anonymous-users Edge Function to run daily at 03:00 UTC.
--
-- Pre-requisites:
--   1. pg_cron extension enabled (Database → Extensions → pg_cron)
--   2. pg_net extension enabled  (Database → Extensions → pg_net)
--   3. The Edge Function is deployed:
--          supabase functions deploy cleanup-anonymous-users
--   4. Set the function-only secret (so only this cron job can invoke it):
--          supabase secrets set CLEANUP_FUNCTION_SECRET=<random-long-string>
--   5. Replace <PROJECT_REF> and <CLEANUP_FUNCTION_SECRET> below with your
--      actual values (or read them from a Postgres role-protected table /
--      vault.secrets if you've set that up).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove any prior schedule with the same name (idempotent).
select cron.unschedule('cleanup-anonymous-users-daily')
where exists (
    select 1 from cron.job where jobname = 'cleanup-anonymous-users-daily'
);

-- Run every day at 03:00 UTC.
select cron.schedule(
    'cleanup-anonymous-users-daily',
    '0 3 * * *',
    $$
        select net.http_post(
            url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/cleanup-anonymous-users',
            headers := jsonb_build_object(
                'Content-Type',     'application/json',
                'x-cleanup-secret', '<CLEANUP_FUNCTION_SECRET>'
            ),
            body    := '{}'::jsonb,
            timeout_milliseconds := 60000
        );
    $$
);

-- Inspect / debug:
--   select * from cron.job where jobname = 'cleanup-anonymous-users-daily';
--   select * from cron.job_run_details order by start_time desc limit 10;
