import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, colleges, collegeClaims } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { emailSchema, phoneSchema, passwordSchema } from '@/validators'
import { hasActiveClaimForCollege, createClaim } from '@/lib/college-claims'
import { sendClaimSubmittedAdminEmail } from '@/lib/admin-mail'

const optionalPhone = z.preprocess(
  (v) => (v === '' ? undefined : v),
  phoneSchema.optional()
)

const claimSchema = z.object({
  existingCollegeId: z.string().uuid(),
  adminName: z.string().min(2, 'Name is required'),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  counsellorName: z.string().optional(),
  counsellorPhone: optionalPhone,
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

  // Check college exists and get current owner
  const college = await db.query.colleges.findFirst({
    where: eq(colleges.id, existingCollegeId),
    columns: { id: true, name: true, userId: true },
  })
  if (!college) {
    return NextResponse.json({ error: 'College not found' }, { status: 404 })
  }

  // Block if college already has a real (non-system) admin
  const [owner] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, college.userId))
    .limit(1)
  if (owner && !owner.email.endsWith('.internal')) {
    return NextResponse.json({ error: 'This college already has a registered admin.' }, { status: 409 })
  }

  // Block if pending or approved claim already exists
  const activeClaim = await hasActiveClaimForCollege(existingCollegeId)
  if (activeClaim) {
    const msg =
      activeClaim.status === 'approved'
        ? 'This college already has a registered admin.'
        : 'A claim for this college is already under review. Please try again later.'
    return NextResponse.json({ error: msg }, { status: 409 })
  }

  // Check if email already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true, passwordHash: true },
  })

  if (existingUser) {
    // Re-apply path: allow if the user has a rejected claim for this college
    const rejectedClaim = await db.query.collegeClaims.findFirst({
      where: and(
        eq(collegeClaims.userId, existingUser.id),
        eq(collegeClaims.collegeId, existingCollegeId),
        eq(collegeClaims.status, 'rejected')
      ),
      columns: { id: true },
    })
    if (!rejectedClaim) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 })
    }
    const valid = await bcrypt.compare(password, existingUser.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 400 })
    }
    await createClaim({
      collegeId: existingCollegeId,
      userId: existingUser.id,
      adminName,
      adminPhone: phone,
      counsellorName,
      counsellorPhone,
    })
    try {
      await sendClaimSubmittedAdminEmail({ collegeName: college.name, adminName, adminEmail: email })
    } catch { /* Non-fatal */ }
    return NextResponse.json({ success: true, path: 'claim' })
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
  } catch { /* Non-fatal */ }

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
