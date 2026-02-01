/*
  # Add Phase 1 Event Types

  1. Changes
    - Add WORLD_CYCLE_COMPLETED event type
    - Add DEVELOPMENT_FOCUS_CHANGED event type
    - Add ALLIANCE_FORMED event type
    - Add ALLIANCE_MEMBER_JOINED event type
    - Add ALLIANCE_MEMBER_LEFT event type
    - Add ALLIANCE_DISSOLVED event type
    - Add CITY_SHARED_GOVERNANCE_GRANTED event type
    - Add CITY_SHARED_GOVERNANCE_REVOKED event type
    - Add TRUST_BROKEN event type

  2. Purpose
    - Track resource cycle execution
    - Track city development changes
    - Track alliance lifecycle events
    - Track governance sharing events
    - Track trust violations
*/

-- Add Phase 1 event types to the enum
ALTER TYPE world_event_type ADD VALUE IF NOT EXISTS 'WORLD_CYCLE_COMPLETED';
ALTER TYPE world_event_type ADD VALUE IF NOT EXISTS 'DEVELOPMENT_FOCUS_CHANGED';
ALTER TYPE world_event_type ADD VALUE IF NOT EXISTS 'ALLIANCE_FORMED';
ALTER TYPE world_event_type ADD VALUE IF NOT EXISTS 'ALLIANCE_MEMBER_JOINED';
ALTER TYPE world_event_type ADD VALUE IF NOT EXISTS 'ALLIANCE_MEMBER_LEFT';
ALTER TYPE world_event_type ADD VALUE IF NOT EXISTS 'ALLIANCE_DISSOLVED';
ALTER TYPE world_event_type ADD VALUE IF NOT EXISTS 'CITY_SHARED_GOVERNANCE_GRANTED';
ALTER TYPE world_event_type ADD VALUE IF NOT EXISTS 'CITY_SHARED_GOVERNANCE_REVOKED';
ALTER TYPE world_event_type ADD VALUE IF NOT EXISTS 'TRUST_BROKEN';
