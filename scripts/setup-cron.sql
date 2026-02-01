-- ============================================================================
-- Automated World Cycles Setup Script
-- ============================================================================
-- This script helps you configure automated world cycle execution
-- Run this in your Supabase SQL Editor after deployment
-- ============================================================================

-- ============================================================================
-- STEP 1: Configure Secrets
-- ============================================================================
-- Replace the values below with your actual deployment URL and admin secret

-- Set your deployed application URL (e.g., https://your-app.netlify.app)
SELECT vault.create_secret(
  'http://localhost:3000',  -- CHANGE THIS to your deployed URL
  'api_base_url_key'
);

-- Set your admin secret (from .env file or your custom secret)
SELECT vault.create_secret(
  'civitas-admin-secret',  -- CHANGE THIS if you use a different secret
  'admin_secret_key'
);

-- ============================================================================
-- STEP 2: Set Cron Schedule
-- ============================================================================
-- Choose the appropriate schedule for your environment

-- FOR DEVELOPMENT (every 5 minutes) - Already set by default
-- No action needed

-- FOR PRODUCTION (daily at midnight UTC) - Uncomment to use
-- SELECT update_world_cycle_schedule('0 0 * * *');

-- FOR PRODUCTION (daily at 3 AM UTC) - Uncomment to use
-- SELECT update_world_cycle_schedule('0 3 * * *');

-- FOR CUSTOM SCHEDULE - Uncomment and modify
-- SELECT update_world_cycle_schedule('0 */6 * * *');  -- Every 6 hours

-- ============================================================================
-- STEP 3: Verify Configuration
-- ============================================================================

-- Check that secrets are set (should see 2 rows)
SELECT name FROM vault.decrypted_secrets
WHERE name IN ('api_base_url_key', 'admin_secret_key');

-- Check the current schedule
SELECT jobname, schedule, command, active
FROM cron.job
WHERE jobname = 'world_cycle_automation';

-- ============================================================================
-- STEP 4: Test Execution
-- ============================================================================

-- Manually trigger a test execution
SELECT trigger_world_cycle_job();

-- Wait 10 seconds, then check the log
SELECT
  job_name,
  executed_at,
  status,
  http_status,
  response_body,
  error_message
FROM cron_job_logs
ORDER BY executed_at DESC
LIMIT 5;

-- ============================================================================
-- MONITORING QUERIES (Save these for later use)
-- ============================================================================

-- View recent executions
-- SELECT * FROM cron_job_logs ORDER BY executed_at DESC LIMIT 20;

-- View failed executions
-- SELECT * FROM cron_job_logs WHERE status = 'failed' ORDER BY executed_at DESC;

-- View cron job execution details
-- SELECT * FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'world_cycle_automation')
-- ORDER BY start_time DESC LIMIT 20;

-- Success rate (last 24 hours)
-- SELECT
--   status,
--   COUNT(*) as count,
--   ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
-- FROM cron_job_logs
-- WHERE executed_at > now() - interval '24 hours'
-- GROUP BY status;

-- ============================================================================
-- DONE!
-- ============================================================================
-- Your automated world cycles are now configured.
-- Monitor the cron_job_logs table to ensure jobs are running successfully.
-- See docs/AUTOMATED_WORLD_CYCLES.md for more details.
-- ============================================================================
