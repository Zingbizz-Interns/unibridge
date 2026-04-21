import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)
type TableRow = { table_name: string }
type ExtensionRow = { extname: string }

async function main() {
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `
  tables.forEach((table) => console.log((table as TableRow).table_name))
  
  console.log('---EXTENSIONS---')
  const exts = await sql`
    SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm','postgis') ORDER BY extname
  `
  exts.forEach((extension) => console.log((extension as ExtensionRow).extname))
}

main()
