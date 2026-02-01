/*
  # Enable pg_cron and pg_net Extensions

  1. Extensions
    - Enable `pg_cron` for scheduled job execution
    - Enable `pg_net` for making HTTP requests from database

  2. Purpose
    - Allows automated execution of world cycles via scheduled database jobs
    - Eliminates need for manual job triggering
    - Provides reliable, infrastructure-level automation
*/

-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
