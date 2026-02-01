-- Migration: add focus system to cities

-- 1. Create enum for city focus (safe if re-run)
DO $$ BEGIN
  CREATE TYPE city_focus AS ENUM (
    'INFRASTRUCTURE',
    'EDUCATION',
    'CULTURE',
    'DEFENSE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add focus columns to cities table
ALTER TABLE cities
  ADD COLUMN IF NOT EXISTS focus city_focus,
  ADD COLUMN IF NOT EXISTS focus_set_at timestamptz;

-- 3. Optional: backfill existing cities
UPDATE cities
SET focus = 'INFRASTRUCTURE',
    focus_set_at = now()
WHERE focus IS NULL;

-- 4. Optional: enforce not-null going forward
ALTER TABLE cities
  ALTER COLUMN focus SET NOT NULL;

-- 5. Index for gameplay queries
CREATE INDEX IF NOT EXISTS idx_cities_focus ON cities(focus);


-- 6. City resource balances table (required by seed)
CREATE TABLE IF NOT EXISTS city_resource_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  materials integer NOT NULL DEFAULT 0,
  energy integer NOT NULL DEFAULT 0,
  knowledge integer NOT NULL DEFAULT 0,
  influence integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(city_id)
);

CREATE INDEX IF NOT EXISTS idx_city_resource_balances_city_id
  ON city_resource_balances(city_id);
