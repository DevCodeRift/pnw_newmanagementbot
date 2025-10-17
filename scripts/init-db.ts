import { initializeDatabase } from '../lib/db'

async function main() {
  console.log('Initializing database...')
  await initializeDatabase()
  console.log('Database initialization complete!')
  process.exit(0)
}

main().catch((error) => {
  console.error('Failed to initialize database:', error)
  process.exit(1)
})
