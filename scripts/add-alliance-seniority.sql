-- Add alliance_seniority column to alliance_members table
ALTER TABLE alliance_members
ADD COLUMN IF NOT EXISTS alliance_seniority INTEGER;

-- Create index for seniority sorting
CREATE INDEX IF NOT EXISTS idx_alliance_members_seniority
ON alliance_members(alliance_seniority DESC);
