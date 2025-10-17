-- Add detailed member statistics columns to alliance_members table
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
ADD COLUMN IF NOT EXISTS war_policy VARCHAR(50),
ADD COLUMN IF NOT EXISTS domestic_policy VARCHAR(50),
ADD COLUMN IF NOT EXISTS color VARCHAR(50),
ADD COLUMN IF NOT EXISTS continent VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for faster sorting queries
CREATE INDEX IF NOT EXISTS idx_alliance_members_score ON alliance_members(score DESC);
CREATE INDEX IF NOT EXISTS idx_alliance_members_cities ON alliance_members(cities DESC);
CREATE INDEX IF NOT EXISTS idx_alliance_members_updated ON alliance_members(updated_at DESC);
