import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL!)

export async function initializeDatabase() {
  try {
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        discord_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        avatar TEXT,
        discriminator VARCHAR(10),
        pnw_api_key TEXT,
        nation_id INTEGER,
        nation_name VARCHAR(255),
        leader_name VARCHAR(255),
        alliance_id INTEGER,
        alliance_name VARCHAR(255),
        alliance_position VARCHAR(100),
        api_key_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_sync TIMESTAMP
      )
    `

    // Alliances table
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

    // Alliance members table (for tracking alliance membership)
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

    // Create indexes for better query performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_nation_id ON users(nation_id)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_alliance_id ON users(alliance_id)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_alliances_slug ON alliances(slug)
    `

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}
