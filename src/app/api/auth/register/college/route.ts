import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, colleges } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { emailSchema, phoneSchema, passwordSchema } from '@/validators'

const registerCollegeSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: emailSchema,
  password: passwordSchema,
  collegeName: z.string().min(2, 'College name is required'),
  phone: phoneSchema,
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, collegeName, phone } = registerCollegeSchema.parse(body)

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    let slug = collegeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    
    // Check slug collision
    const existingCollege = await db.query.colleges.findFirst({ where: eq(colleges.slug, slug) })
    if (existingCollege) {
      slug = `${slug}-${Math.floor(Math.random() * 10000)}`
    }

    const [newUser] = await db.insert(users).values({
      name,
      email,
      passwordHash,
      phone,
      role: 'college',
    }).returning()

    try {
      await db.insert(colleges).values({
        userId: newUser.id,
        name: collegeName,
        slug,
        verificationStatus: 'pending',
      })
    } catch (collegeError) {
      // Manual rollback if the second insert fails
      await db.delete(users).where(eq(users.id, newUser.id))
      throw collegeError
    }

    return NextResponse.json({ success: true, user: { id: newUser.id, email: newUser.email, role: newUser.role } })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid registration details' },
        { status: 400 }
      )
    }
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
