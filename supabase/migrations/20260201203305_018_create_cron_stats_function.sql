/*
  # Create Cron Stats Function

  1. Function: get_cron_stats()
    - Returns statistics about cron job execution
    - Shows success/failure counts
    - Calculates uptime percentage
    - Provides last execution timestamp

  2. Purpose
    - Used by admin API to display cron health
    - Helps monitor system reliability
    - Quick overview of automation status
*/

CREATE OR REPLACE FUNCTION get_cron_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_count int;
  success_count int;
  failed_count int;
  last_success timestamptz;
  last_execution timestamptz;
  uptime_percentage numeric;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM cron_job_logs;

  SELECT COUNT(*) INTO success_count
  FROM cron_job_logs
  WHERE status IN ('success', 'initiated');

  SELECT COUNT(*) INTO failed_count
  FROM cron_job_logs
  WHERE status = 'failed';

  SELECT MAX(executed_at) INTO last_success
  FROM cron_job_logs
  WHERE status IN ('success', 'initiated');

  SELECT MAX(executed_at) INTO last_execution
  FROM cron_job_logs;

  IF total_count > 0 THEN
    uptime_percentage := ROUND((success_count::numeric / total_count::numeric) * 100, 2);
  ELSE
    uptime_percentage := 0;
  END IF;

  RETURN jsonb_build_object(
    'total_executions', total_count,
    'successful_executions', success_count,
    'failed_executions', failed_count,
    'uptime_percentage', uptime_percentage,
    'last_success', last_success,
    'last_execution', last_execution
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_cron_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_cron_stats() TO service_role;
