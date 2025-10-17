-- Fix alliance_members table schema for sync functionality
-- This migration adds all necessary columns and constraints

-- Step 1: Add columns if they don't exist
ALTER TABLE alliance_members
ADD COLUMN IF NOT EXISTS nation_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS leader_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS score NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS cities INTEGER,
ADD COLUMN IF NOT EXISTS soldiers INTEGER,
ADD COLUMN IF NOT EXISTS tanks INTEGER,
ADD COLUMN IF NOT EXISTS aircraft INTEGER,
ADD COLUMN IF NOT EXISTS ships INTEGER,
ADD COLUMN IF NOT EXISTS missiles INTEGER,
ADD COLUMN IF NOT EXISTS nukes INTEGER,
ADD COLUMN IF NOT EXISTS position VARCHAR(100),
ADD COLUMN IF NOT EXISTS war_policy VARCHAR(50),
ADD COLUMN IF NOT EXISTS domestic_policy VARCHAR(50),
ADD COLUMN IF NOT EXISTS color VARCHAR(50),
ADD COLUMN IF NOT EXISTS continent VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Add the critical UNIQUE constraint for ON CONFLICT
-- This allows upsert operations (INSERT ... ON CONFLICT ... DO UPDATE)
ALTER TABLE alliance_members
DROP CONSTRAINT IF EXISTS alliance_members_nation_alliance_unique;

ALTER TABLE alliance_members
ADD CONSTRAINT alliance_members_nation_alliance_unique
UNIQUE (nation_id, alliance_id);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_alliance_members_score
ON alliance_members(score DESC);

CREATE INDEX IF NOT EXISTS idx_alliance_members_cities
ON alliance_members(cities DESC);

CREATE INDEX IF NOT EXISTS idx_alliance_members_updated
ON alliance_members(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_alliance_members_alliance
ON alliance_members(alliance_id);

-- Verify the constraint was created
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'alliance_members'::regclass
AND contype = 'u';
