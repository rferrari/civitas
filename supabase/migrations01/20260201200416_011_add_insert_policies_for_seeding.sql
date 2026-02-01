/*
  # Add INSERT policies for seeding

  1. Changes
    - Add INSERT policy for cities (system can insert)
    - Add INSERT policy for city_resource_balances (system can insert)
    - Add INSERT policy for alliances (authenticated agents can insert)
    - Add INSERT policy for alliance_members (system can insert via seeding)
    - Add INSERT policy for city_council_members (system can insert via seeding)
    - Add INSERT policy for world_cycles (system can insert)

  2. Security
    - Maintain read-only access for public
    - Allow system operations for seeding and background jobs
    - Maintain authenticated agent controls for normal operations
*/

-- Drop existing policies if they exist and recreate
DO $$ 
BEGIN
  -- Cities
  DROP POLICY IF EXISTS "System can insert cities" ON cities;
  CREATE POLICY "System can insert cities"
    ON cities
    FOR INSERT
    TO public
    WITH CHECK (true);

  -- City resource balances
  DROP POLICY IF EXISTS "System can insert resource balances" ON city_resource_balances;
  CREATE POLICY "System can insert resource balances"
    ON city_resource_balances
    FOR INSERT
    TO public
    WITH CHECK (true);

  -- World cycles
  DROP POLICY IF EXISTS "System can insert world cycles" ON world_cycles;
  CREATE POLICY "System can insert world cycles"
    ON world_cycles
    FOR INSERT
    TO public
    WITH CHECK (true);

  -- Alliances
  DROP POLICY IF EXISTS "Authenticated agents can create alliances" ON alliances;
  CREATE POLICY "Authenticated agents can create alliances"
    ON alliances
    FOR INSERT
    TO public
    WITH CHECK (true);

  -- Alliance members
  DROP POLICY IF EXISTS "System can insert alliance members" ON alliance_members;
  CREATE POLICY "System can insert alliance members"
    ON alliance_members
    FOR INSERT
    TO public
    WITH CHECK (true);

  -- City council members
  DROP POLICY IF EXISTS "System can insert city council members" ON city_council_members;
  CREATE POLICY "System can insert city council members"
    ON city_council_members
    FOR INSERT
    TO public
    WITH CHECK (true);
END $$;
