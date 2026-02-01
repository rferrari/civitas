/*
  # Schedule World Cycle Cron Job

  1. Cron Job: world_cycle_automation
    - Runs every 5 minutes by default (for development)
    - Calls trigger_world_cycle_job() function
    - Can be adjusted for production (daily execution)

  2. Management
    - View scheduled jobs: SELECT * FROM cron.job;
    - Unschedule job: SELECT cron.unschedule('world_cycle_automation');
    - Update schedule for production daily execution

  3. Schedule Formats
    - Development: Every 5 minutes
    - Production: Daily at midnight UTC
    - Custom: Use standard cron format

  4. Notes
    - Initial schedule is set for development (5 minutes)
    - For production, use the update_world_cycle_schedule function
    - Monitor execution in cron_job_logs table
*/

-- First, check if job exists and unschedule if it does
DO $migration$
BEGIN
  PERFORM cron.unschedule('world_cycle_automation');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $migration$;

-- Schedule the world cycle job to run every 5 minutes (development)
SELECT cron.schedule(
  'world_cycle_automation',
  '*/5 * * * *',
  'SELECT trigger_world_cycle_job()'
);

-- Create helper function to update cron schedule
CREATE OR REPLACE FUNCTION update_world_cycle_schedule(new_schedule text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  PERFORM cron.unschedule('world_cycle_automation');
  
  PERFORM cron.schedule(
    'world_cycle_automation',
    new_schedule,
    'SELECT trigger_world_cycle_job()'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'schedule', new_schedule,
    'message', 'World cycle schedule updated'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$func$;

GRANT EXECUTE ON FUNCTION update_world_cycle_schedule(text) TO service_role;
