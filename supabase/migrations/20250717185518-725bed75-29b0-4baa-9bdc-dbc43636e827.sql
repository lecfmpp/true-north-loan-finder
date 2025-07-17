-- Enable pg_cron extension for scheduled email processing
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to process scheduled emails every 5 minutes
SELECT cron.schedule(
  'process-scheduled-emails',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://kgwcogltpsmapxnjzjhm.supabase.co/functions/v1/process-scheduled-emails',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd2NvZ2x0cHNtYXB4bmp6amhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTI5MjAsImV4cCI6MjA2NzkyODkyMH0.zTQ6IUFqaSOiTNuEMVbIoqIKIPCbLT9GgPvsnTtYVEI"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);