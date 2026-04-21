import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { emailSchema, passwordSchema, phoneSchema } from '@/validators'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, phone } = registerSchema.parse(body)

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const [newUser] = await db.insert(users).values({
      name,
      email,
      passwordHash,
      phone,
      role: 'student',
    }).returning()

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
