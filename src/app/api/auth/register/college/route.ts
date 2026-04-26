import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, colleges } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { emailSchema, phoneSchema, passwordSchema } from '@/validators'
import { hasActiveClaimForCollege, createClaim } from '@/lib/college-claims'
import { sendClaimSubmittedAdminEmail } from '@/lib/admin-mail'

const claimSchema = z.object({
  existingCollegeId: z.string().uuid(),
  adminName: z.string().min(2, 'Name is required'),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  counsellorName: z.string().optional(),
  counsellorPhone: z.string().optional(),
})

const newCollegeSchema = z.object({
  collegeName: z.string().min(2, 'College name is required'),
  name: z.string().min(2, 'Name is required'),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Determine path: claim or new college
    if (body.existingCollegeId) {
      return await handleClaim(body)
    }
    return await handleNewCollege(body)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid details' },
        { status: 400 }
      )
    }
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleClaim(body: unknown) {
  const {
    existingCollegeId,
    adminName,
    email,
    phone,
    password,
    counsellorName,
    counsellorPhone,
  } = claimSchema.parse(body)

  // Check college exists
  const college = await db.query.colleges.findFirst({
    where: eq(colleges.id, existingCollegeId),
    columns: { id: true, name: true, userId: true },
  })
  if (!college) {
    return NextResponse.json({ error: 'College not found' }, { status: 404 })
  }

  // Block if already has an approved admin or pending/approved claim
  const activeClaim = await hasActiveClaimForCollege(existingCollegeId)
  if (activeClaim) {
    const msg =
      activeClaim.status === 'approved'
        ? 'This college already has a registered admin.'
        : 'A claim for this college is already under review. Please try again later.'
    return NextResponse.json({ error: msg }, { status: 409 })
  }

  // Block if user email already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true },
  })
  if (existingUser) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const [newUser] = await db
    .insert(users)
    .values({ name: adminName, email, passwordHash, phone, role: 'college' })
    .returning()

  try {
    await createClaim({
      collegeId: existingCollegeId,
      userId: newUser.id,
      adminName,
      adminPhone: phone,
      counsellorName,
      counsellorPhone,
    })
  } catch (err) {
    await db.delete(users).where(eq(users.id, newUser.id))
    throw err
  }

  try {
    await sendClaimSubmittedAdminEmail({ collegeName: college.name, adminName, adminEmail: email })
  } catch {
    // Non-fatal
  }

  return NextResponse.json({ success: true, path: 'claim' })
}

async function handleNewCollege(body: unknown) {
  const { collegeName, name, email, phone, password } = newCollegeSchema.parse(body)

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true },
  })
  if (existingUser) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  let slug = collegeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

  const slugConflict = await db.query.colleges.findFirst({
    where: eq(colleges.slug, slug),
    columns: { id: true },
  })
  if (slugConflict) {
    slug = `${slug}-${Math.floor(Math.random() * 10000)}`
  }

  const [newUser] = await db
    .insert(users)
    .values({ name, email, passwordHash, phone, role: 'college' })
    .returning()

  try {
    await db.insert(colleges).values({
      userId: newUser.id,
      name: collegeName,
      slug,
      verificationStatus: 'pending',
    })
  } catch (err) {
    await db.delete(users).where(eq(users.id, newUser.id))
    throw err
  }

  return NextResponse.json({ success: true, path: 'new' })
}
