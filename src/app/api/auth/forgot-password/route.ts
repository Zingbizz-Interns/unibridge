import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { sendMail } from '@/lib/mail'
import crypto from 'crypto'
import { z } from 'zod'
import { emailSchema } from '@/validators'

const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export async function POST(req: Request) {
  try {
    const { email } = forgotPasswordSchema.parse(await req.json())

    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    })

    if (!user) {
      return NextResponse.json({ success: true, message: 'If you have an account, a reset link will be sent.' })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000)

    await db.update(users)
      .set({ resetToken: resetTokenHash, resetTokenExpiry })
      .where(eq(users.id, user.id))

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`

    await sendMail({
      to: email,
      subject: 'Reset your UniBridge password',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid email address' },
        { status: 400 }
      )
    }

    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
