/*
  # Create World Cycle Trigger Function

  1. Function: `trigger_world_cycle_job()`
    - Makes HTTP POST request to /api/admin/jobs endpoint
    - Logs execution details to cron_job_logs table
    - Handles errors gracefully
    - Returns execution status

  2. Purpose
    - Called by pg_cron scheduled job
    - Triggers automated world cycle execution
    - Provides monitoring and error tracking

  3. Configuration
    - Uses Supabase secrets for ADMIN_SECRET
    - Constructs API URL from environment
    - Logs all execution attempts

  4. Notes
    - You must configure the following Supabase secrets:
      - ADMIN_SECRET: Authorization token for jobs endpoint
      - API_BASE_URL: Base URL of your deployed application
    - Run these commands in Supabase SQL Editor:
      SELECT vault.create_secret('civitas-admin-secret', 'admin_secret_key');
      SELECT vault.create_secret('https://your-app-url.netlify.app', 'api_base_url_key');
*/

-- Create function to trigger world cycle via HTTP
CREATE OR REPLACE FUNCTION trigger_world_cycle_job()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id uuid;
  response_record RECORD;
  api_url text;
  admin_secret text;
  request_id bigint;
BEGIN
  -- Get configuration from Supabase secrets or use defaults
  -- Note: In production, you should set these secrets in Supabase Dashboard
  -- For now, we'll use a placeholder approach that will work with environment
  
  -- Try to get from vault, fallback to default
  BEGIN
    SELECT decrypted_secret INTO admin_secret 
    FROM vault.decrypted_secrets 
    WHERE name = 'admin_secret_key' 
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    admin_secret := 'civitas-admin-secret';
  END;

  BEGIN
    SELECT decrypted_secret INTO api_url 
    FROM vault.decrypted_secrets 
    WHERE name = 'api_base_url_key' 
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    -- This will need to be updated with your actual deployment URL
    api_url := current_setting('app.settings.api_base_url', true);
    IF api_url IS NULL THEN
      api_url := 'http://localhost:3000';
    END IF;
  END;

  -- Construct full API endpoint URL
  api_url := api_url || '/api/admin/jobs';

  -- Create log entry
  INSERT INTO cron_job_logs (job_name, status, executed_at)
  VALUES ('trigger_world_cycle', 'pending', now())
  RETURNING id INTO log_id;

  -- Make HTTP request using pg_net
  SELECT 
    net.http_post(
      url := api_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || admin_secret
      ),
      body := jsonb_build_object('job', 'all')
    ) INTO request_id;

  -- Wait briefly for response (pg_net is async, but we'll update log in callback)
  -- For now, mark as initiated
  UPDATE cron_job_logs
  SET status = 'initiated',
      response_body = jsonb_build_object(
        'request_id', request_id,
        'api_url', api_url,
        'timestamp', now()
      )
  WHERE id = log_id;

  RETURN jsonb_build_object(
    'success', true,
    'log_id', log_id,
    'request_id', request_id,
    'message', 'World cycle job triggered'
  );

EXCEPTION WHEN OTHERS THEN
  -- Log error
  UPDATE cron_job_logs
  SET status = 'failed',
      error_message = SQLERRM
  WHERE id = log_id;

  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'log_id', log_id
  );
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION trigger_world_cycle_job() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_world_cycle_job() TO service_role;
