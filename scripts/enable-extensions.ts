import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Enabling pg_trgm extension...')
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`
  console.log('✓ pg_trgm enabled')

  console.log('Enabling PostGIS extension...')
  await sql`CREATE EXTENSION IF NOT EXISTS postgis`
  console.log('✓ PostGIS enabled')

  console.log('\nAll extensions enabled successfully!')
}

main().catch((err) => {
  console.error('Failed to enable extensions:', err)
  process.exit(1)
})
