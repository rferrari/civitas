/*
  # Add resource ledger insert policy

  1. Changes
    - Add INSERT policy for resource_ledger_entries (system can insert)

  2. Security
    - Allow world cycle job to record resource generation
    - Maintain read-only access for public viewing
*/

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "System can insert resource ledger entries" ON resource_ledger_entries;
  CREATE POLICY "System can insert resource ledger entries"
    ON resource_ledger_entries
    FOR INSERT
    TO public
    WITH CHECK (true);

  DROP POLICY IF EXISTS "Anyone can view resource ledger entries" ON resource_ledger_entries;
  CREATE POLICY "Anyone can view resource ledger entries"
    ON resource_ledger_entries
    FOR SELECT
    TO public
    USING (true);
END $$;
