import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'
import { passwordSchema } from '@/validators'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
})

export async function POST(req: Request) {
  try {
    const { token, password } = resetPasswordSchema.parse(await req.json())
    const now = new Date()
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const userList = await db.select()
      .from(users)
      .where(and(
        eq(users.resetToken, resetTokenHash),
        gt(users.resetTokenExpiry, now)
      ))
      .limit(1)

    if (userList.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    const user = userList[0]
    const passwordHash = await bcrypt.hash(password, 10)

    await db.update(users)
      .set({
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null
      })
      .where(eq(users.id, user.id))

    return NextResponse.json({ success: true, message: 'Password reset successful' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid reset request' },
        { status: 400 }
      )
    }

    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
