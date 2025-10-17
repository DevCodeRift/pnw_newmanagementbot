import { neon } from '@neondatabase/serverless'

async function migrateDatabase() {
  const sql = neon(process.env.DATABASE_URL!)

  console.log('Starting database migration...')

  try {
    // Add new columns to users table
    console.log('Adding new columns to users table...')

    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS pnw_api_key TEXT,
      ADD COLUMN IF NOT EXISTS nation_id INTEGER,
      ADD COLUMN IF NOT EXISTS nation_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS leader_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS alliance_id INTEGER,
      ADD COLUMN IF NOT EXISTS alliance_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS alliance_position VARCHAR(100),
      ADD COLUMN IF NOT EXISTS api_key_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP
    `

    console.log('✓ Users table updated')

    // Create alliances table
    console.log('Creating alliances table...')

    await sql`
      CREATE TABLE IF NOT EXISTS alliances (
        id SERIAL PRIMARY KEY,
        alliance_id INTEGER UNIQUE NOT NULL,
        alliance_name VARCHAR(255) NOT NULL,
        acronym VARCHAR(50),
        slug VARCHAR(255) UNIQUE NOT NULL,
        color VARCHAR(50),
        score INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log('✓ Alliances table created')

    // Create alliance_members table
    console.log('Creating alliance_members table...')

    await sql`
      CREATE TABLE IF NOT EXISTS alliance_members (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        alliance_id INTEGER REFERENCES alliances(id) ON DELETE CASCADE,
        nation_id INTEGER NOT NULL,
        position VARCHAR(100),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, alliance_id)
      )
    `

    console.log('✓ Alliance members table created')

    // Create indexes
    console.log('Creating indexes...')

    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_nation_id ON users(nation_id)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_alliance_id ON users(alliance_id)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_alliances_slug ON alliances(slug)
    `

    console.log('✓ Indexes created')

    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

// Run migration
migrateDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
