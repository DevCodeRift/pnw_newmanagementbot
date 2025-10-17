-- Add position_name and position_level columns to store custom position info
ALTER TABLE alliance_members
ADD COLUMN IF NOT EXISTS position_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS position_level INTEGER;

-- Create index for position level sorting
CREATE INDEX IF NOT EXISTS idx_alliance_members_position_level
ON alliance_members(position_level DESC);

-- Update existing records: set position_name to the enum value if not set
-- This handles backwards compatibility
UPDATE alliance_members
SET position_name = position
WHERE position_name IS NULL AND position IS NOT NULL;
