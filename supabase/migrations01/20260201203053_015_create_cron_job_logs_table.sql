/*
  # Create Cron Job Logs Table

  1. New Table: `cron_job_logs`
    - `id` (uuid, primary key) - Unique log entry identifier
    - `job_name` (text) - Name of the cron job executed
    - `executed_at` (timestamptz) - When the job was triggered
    - `status` (text) - Execution status (success, failed, pending)
    - `http_status` (integer, nullable) - HTTP response status code
    - `response_body` (jsonb, nullable) - Response from the API endpoint
    - `error_message` (text, nullable) - Error details if job failed

  2. Security
    - Enable RLS on `cron_job_logs` table
    - Only allow authenticated users to read logs
    - System can insert/update logs without authentication

  3. Indexes
    - Index on `executed_at` for efficient time-based queries
    - Index on `status` for filtering by execution result
*/

-- Create cron_job_logs table
CREATE TABLE IF NOT EXISTS cron_job_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  executed_at timestamptz DEFAULT now() NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  http_status integer,
  response_body jsonb,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_executed_at ON cron_job_logs(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_status ON cron_job_logs(status);
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_job_name ON cron_job_logs(job_name);

-- Enable RLS
ALTER TABLE cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read logs
CREATE POLICY "Authenticated users can read cron job logs"
  ON cron_job_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role (system) to insert and update logs
CREATE POLICY "Service role can insert cron job logs"
  ON cron_job_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update cron job logs"
  ON cron_job_logs
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
