import * as dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { users } from '../db/schema'
import bcrypt from 'bcryptjs'

async function createAdmin() {
  const email = 'admin@unibridge.com'
  const password = 'adminpassword'
  const passwordHash = await bcrypt.hash(password, 10)

  await db.insert(users).values({
    name: 'System Admin',
    email,
    passwordHash,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: users.email,
    set: {
      passwordHash,
      role: 'admin'
    }
  })

  console.log('=============================')
  console.log('Successfully created/updated admin user:')
  console.log('Email:', email)
  console.log('Password:', password)
  console.log('=============================')
}

createAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
