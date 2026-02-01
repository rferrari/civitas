# Automated World Cycles with pg_cron

This document explains how automated world cycle execution works using Supabase's pg_cron extension.

## Overview

The system uses PostgreSQL's pg_cron extension to automatically trigger world cycle jobs at regular intervals. This eliminates the need to manually call the jobs endpoint.

## Architecture

### Components

1. **pg_cron Extension** - PostgreSQL job scheduler
2. **pg_net Extension** - Makes HTTP requests from database
3. **trigger_world_cycle_job()** - Database function that calls the jobs API
4. **cron_job_logs Table** - Tracks execution history
5. **world_cycle_automation Job** - Scheduled cron job

### Flow

```
pg_cron (schedule)
  → trigger_world_cycle_job()
  → HTTP POST to /api/admin/jobs
  → Job execution
  → Log results
```

## Configuration

### 1. Set Deployment URL

The cron job needs to know your application's URL. You have two options:

#### Option A: Using Supabase Secrets (Recommended for Production)

Run this in the Supabase SQL Editor:

```sql
-- Store your deployment URL
SELECT vault.create_secret(
  'https://your-app.netlify.app',
  'api_base_url_key'
);

-- Store your admin secret
SELECT vault.create_secret(
  'your-admin-secret-here',
  'admin_secret_key'
);
```

#### Option B: Using Database Settings (Development)

```sql
-- Set the API base URL
ALTER DATABASE postgres SET app.settings.api_base_url = 'http://localhost:3000';
```

### 2. Update Admin Secret (If Different from Default)

If you're using a custom `ADMIN_SECRET` in your `.env` file, update it in Supabase:

```sql
SELECT vault.create_secret(
  'your-custom-admin-secret',
  'admin_secret_key'
);
```

### 3. Adjust Schedule (Production)

The default schedule runs every 5 minutes (for development). For production, update to daily:

```sql
-- Update to run daily at midnight UTC
SELECT update_world_cycle_schedule('0 0 * * *');
```

Common schedules:
- Every 5 minutes: `*/5 * * * *` (default)
- Every hour: `0 * * * *`
- Every 6 hours: `0 */6 * * *`
- Daily at midnight: `0 0 * * *`
- Daily at 3 AM: `0 3 * * *`

## Monitoring

### View Scheduled Jobs

```sql
SELECT * FROM cron.job;
```

### View Execution Logs

```sql
-- Recent executions
SELECT * FROM cron_job_logs
ORDER BY executed_at DESC
LIMIT 20;

-- Failed executions
SELECT * FROM cron_job_logs
WHERE status = 'failed'
ORDER BY executed_at DESC;

-- Success rate (last 24 hours)
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM cron_job_logs
WHERE executed_at > now() - interval '24 hours'
GROUP BY status;
```

### View pg_cron Execution History

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'world_cycle_automation')
ORDER BY start_time DESC
LIMIT 20;
```

## Manual Testing

### Test the Function Directly

```sql
SELECT trigger_world_cycle_job();
```

This will:
1. Create a log entry
2. Make an HTTP request to your jobs endpoint
3. Return the result

### Verify Configuration

```sql
-- Check if secrets are set
SELECT name FROM vault.decrypted_secrets
WHERE name IN ('api_base_url_key', 'admin_secret_key');

-- Check current schedule
SELECT jobname, schedule, command
FROM cron.job
WHERE jobname = 'world_cycle_automation';
```

## Troubleshooting

### Job Not Running

1. **Check if job is scheduled:**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'world_cycle_automation';
   ```

2. **Check recent execution attempts:**
   ```sql
   SELECT * FROM cron.job_run_details
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'world_cycle_automation')
   ORDER BY start_time DESC LIMIT 5;
   ```

3. **Verify extensions are enabled:**
   ```sql
   SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
   ```

### HTTP Requests Failing

1. **Check logs for errors:**
   ```sql
   SELECT * FROM cron_job_logs
   WHERE status = 'failed'
   ORDER BY executed_at DESC;
   ```

2. **Verify API URL is correct:**
   ```sql
   SELECT decrypted_secret FROM vault.decrypted_secrets
   WHERE name = 'api_base_url_key';
   ```

3. **Test manually:**
   ```sql
   SELECT trigger_world_cycle_job();
   ```

### Wrong Schedule

```sql
-- Update schedule
SELECT update_world_cycle_schedule('0 0 * * *');
```

## Disabling Automation

To temporarily disable automation:

```sql
-- Unschedule the job
SELECT cron.unschedule('world_cycle_automation');
```

To re-enable:

```sql
-- Re-schedule (every 5 minutes)
SELECT cron.schedule(
  'world_cycle_automation',
  '*/5 * * * *',
  'SELECT trigger_world_cycle_job()'
);
```

## Security Notes

- The `trigger_world_cycle_job()` function runs with `SECURITY DEFINER`, meaning it executes with the privileges of the function owner
- Admin secrets are stored in Supabase Vault (encrypted)
- RLS policies ensure only authenticated users can view logs
- The jobs endpoint requires proper Authorization header

## Production Checklist

Before deploying to production:

- [ ] Set correct API_BASE_URL in Supabase secrets
- [ ] Set correct ADMIN_SECRET in Supabase secrets
- [ ] Update cron schedule to daily (or appropriate interval)
- [ ] Test manual execution
- [ ] Monitor logs for first few executions
- [ ] Set up alerts for failed executions

## API Endpoint Details

The cron job calls: `POST /api/admin/jobs`

Headers:
- `Content-Type: application/json`
- `Authorization: Bearer <ADMIN_SECRET>`

Body:
```json
{
  "job": "all"
}
```

This triggers all jobs:
- World cycle execution
- Mark overdue cities as contested
- Generate daily report
- Generate weekly report (if applicable)
