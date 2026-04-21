/**
 * Seed script: inserts demo colleges + courses so the Explore Courses
 * section has real data to navigate to.
 *
 * Run with:
 *   npx tsx src/scripts/seed-demo-colleges.ts
 *
 * Requires DATABASE_URL in your .env.local (loaded via dotenv).
 */

import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import * as schema from '../db/schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

// ─── helpers ─────────────────────────────────────────────────────────────────

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function upsertDemoUser() {
  const email = 'demo-system@unibridge.internal'
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)

  if (existing.length) return existing[0].id

  const [user] = await db
    .insert(schema.users)
    .values({
      email,
      passwordHash: '$2b$10$DEMO_HASH_NOT_FOR_LOGIN',
      role: 'college',
      name: 'Demo System',
    })
    .returning({ id: schema.users.id })

  return user.id
}

// ─── seed data ───────────────────────────────────────────────────────────────

const demoColleges: Array<{
  name: string
  city: string
  state: string
  nirfRank?: number
  category: 'engineering' | 'medical' | 'arts_science'
  collegeType: 'affiliated' | 'university' | 'autonomous'
  courses: Array<{
    name: string
    degree: string
    duration: number   // years
    courseLevel: 'ug' | 'pg' | 'doctorate' | 'diploma' | 'certification'
    stream: string
    annualFee: number
  }>
}> = [
  // ── UG Bachelors ──
  {
    name: 'Delhi Institute of Technology',
    city: 'Delhi',
    state: 'Delhi',
    nirfRank: 45,
    category: 'engineering',
    collegeType: 'autonomous',
    courses: [
      { name: 'BE / B.Tech (CSE)', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 180000 },
      { name: 'BCA', degree: 'BCA', duration: 3, courseLevel: 'ug', stream: 'Computer Applications', annualFee: 75000 },
      { name: 'B.Com General', degree: 'B.Com', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 40000 },
    ],
  },
  {
    name: 'Pune College of Commerce & Science',
    city: 'Pune',
    state: 'Maharashtra',
    nirfRank: 120,
    category: 'arts_science',
    collegeType: 'affiliated',
    courses: [
      { name: 'BBA', degree: 'BBA', duration: 3, courseLevel: 'ug', stream: 'Business Administration', annualFee: 60000 },
      { name: 'BA English Honours', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'English', annualFee: 25000 },
      { name: 'B.Sc Nursing', degree: 'B.Sc', duration: 4, courseLevel: 'ug', stream: 'Nursing', annualFee: 120000 },
    ],
  },
  {
    name: 'Bangalore Medical & Law Academy',
    city: 'Bangalore',
    state: 'Karnataka',
    nirfRank: 88,
    category: 'medical',
    collegeType: 'autonomous',
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 850000 },
      { name: 'LLB (3 Year)', degree: 'LLB', duration: 3, courseLevel: 'ug', stream: 'Law', annualFee: 65000 },
    ],
  },

  // ── PG Masters ──
  {
    name: 'Indian Institute of Management Studies',
    city: 'Hyderabad',
    state: 'Telangana',
    nirfRank: 12,
    category: 'arts_science',
    collegeType: 'university',
    courses: [
      { name: 'MBA', degree: 'MBA', duration: 2, courseLevel: 'pg', stream: 'Business Administration', annualFee: 950000 },
      { name: 'M.Com', degree: 'M.Com', duration: 2, courseLevel: 'pg', stream: 'Commerce', annualFee: 55000 },
      { name: 'MA Psychology', degree: 'MA', duration: 2, courseLevel: 'pg', stream: 'Psychology', annualFee: 45000 },
    ],
  },
  {
    name: 'National Institute of Advanced Technology',
    city: 'Chennai',
    state: 'Tamil Nadu',
    nirfRank: 28,
    category: 'engineering',
    collegeType: 'autonomous',
    courses: [
      { name: 'M.Tech (CSE)', degree: 'M.Tech', duration: 2, courseLevel: 'pg', stream: 'Computer Science', annualFee: 175000 },
      { name: 'MCA', degree: 'MCA', duration: 2, courseLevel: 'pg', stream: 'Computer Applications', annualFee: 90000 },
      { name: 'M.Sc Data Science', degree: 'M.Sc', duration: 2, courseLevel: 'pg', stream: 'Data Science', annualFee: 220000 },
    ],
  },
  {
    name: 'Kolkata School of Law & Management',
    city: 'Kolkata',
    state: 'West Bengal',
    nirfRank: 65,
    category: 'arts_science',
    collegeType: 'affiliated',
    courses: [
      { name: 'LLM', degree: 'LLM', duration: 1, courseLevel: 'pg', stream: 'Law', annualFee: 80000 },
      { name: 'M.Ed', degree: 'M.Ed', duration: 2, courseLevel: 'pg', stream: 'Education', annualFee: 55000 },
    ],
  },

  // ── Doctorate ──
  {
    name: 'Indian Research University',
    city: 'Mumbai',
    state: 'Maharashtra',
    nirfRank: 8,
    category: 'engineering',
    collegeType: 'university',
    courses: [
      { name: 'PhD Computer Science', degree: 'PhD', duration: 4, courseLevel: 'doctorate', stream: 'Computer Science', annualFee: 60000 },
      { name: 'PhD Management', degree: 'PhD', duration: 4, courseLevel: 'doctorate', stream: 'Management', annualFee: 80000 },
      { name: 'PhD Engineering', degree: 'PhD', duration: 4, courseLevel: 'doctorate', stream: 'Engineering', annualFee: 55000 },
    ],
  },
  {
    name: 'Jaipur Centre for Advanced Studies',
    city: 'Jaipur',
    state: 'Rajasthan',
    nirfRank: 72,
    category: 'arts_science',
    collegeType: 'university',
    courses: [
      { name: 'PhD Economics', degree: 'PhD', duration: 4, courseLevel: 'doctorate', stream: 'Economics', annualFee: 45000 },
      { name: 'PhD Mathematics', degree: 'PhD', duration: 4, courseLevel: 'doctorate', stream: 'Mathematics', annualFee: 40000 },
      { name: 'PhD Chemistry', degree: 'PhD', duration: 4, courseLevel: 'doctorate', stream: 'Chemistry', annualFee: 48000 },
    ],
  },

  // ── Diploma ──
  {
    name: 'Ahmedabad Polytechnic Institute',
    city: 'Ahmedabad',
    state: 'Gujarat',
    nirfRank: undefined,
    category: 'engineering',
    collegeType: 'affiliated',
    courses: [
      { name: 'Diploma in Engineering', degree: 'Diploma', duration: 3, courseLevel: 'diploma', stream: 'Engineering', annualFee: 35000 },
      { name: 'Diploma in Computer App.', degree: 'Diploma', duration: 1, courseLevel: 'diploma', stream: 'Computer Applications', annualFee: 25000 },
      { name: 'Diploma in Architecture', degree: 'Diploma', duration: 3, courseLevel: 'diploma', stream: 'Architecture', annualFee: 55000 },
    ],
  },
  {
    name: 'Chandigarh Institute of Hotel & Design',
    city: 'Chandigarh',
    state: 'Punjab',
    nirfRank: undefined,
    category: 'arts_science',
    collegeType: 'affiliated',
    courses: [
      { name: 'Diploma in Hotel Mgmt.', degree: 'Diploma', duration: 2, courseLevel: 'diploma', stream: 'Hotel Management', annualFee: 65000 },
      { name: 'Diploma in Fashion Design', degree: 'Diploma', duration: 2, courseLevel: 'diploma', stream: 'Fashion Design', annualFee: 75000 },
      { name: 'Diploma in Journalism', degree: 'Diploma', duration: 1, courseLevel: 'diploma', stream: 'Journalism', annualFee: 30000 },
    ],
  },

  // ── Certification ──
  {
    name: 'TechSkills Academy India',
    city: 'Bangalore',
    state: 'Karnataka',
    nirfRank: undefined,
    category: 'engineering',
    collegeType: 'autonomous',
    courses: [
      { name: 'Data Science & ML', degree: 'Certificate', duration: 1, courseLevel: 'certification', stream: 'Data Science', annualFee: 85000 },
      { name: 'Cloud Computing', degree: 'Certificate', duration: 1, courseLevel: 'certification', stream: 'Cloud Computing', annualFee: 65000 },
      { name: 'Full Stack Development', degree: 'Certificate', duration: 1, courseLevel: 'certification', stream: 'Full Stack Development', annualFee: 90000 },
    ],
  },
  {
    name: 'Digital Futures Institute',
    city: 'Delhi',
    state: 'Delhi',
    nirfRank: undefined,
    category: 'arts_science',
    collegeType: 'autonomous',
    courses: [
      { name: 'Digital Marketing', degree: 'Certificate', duration: 1, courseLevel: 'certification', stream: 'Digital Marketing', annualFee: 45000 },
      { name: 'UI/UX Design', degree: 'Certificate', duration: 1, courseLevel: 'certification', stream: 'UI/UX Design', annualFee: 60000 },
      { name: 'Cybersecurity', degree: 'Certificate', duration: 1, courseLevel: 'certification', stream: 'Cybersecurity', annualFee: 75000 },
    ],
  },
]

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding demo colleges...')

  const userId = await upsertDemoUser()
  console.log(`Using demo user: ${userId}`)

  let collegesInserted = 0
  let coursesInserted = 0

  for (const col of demoColleges) {
    const collegeSlug = slug(col.name)

    // Skip if already exists
    const existing = await db
      .select({ id: schema.colleges.id })
      .from(schema.colleges)
      .where(eq(schema.colleges.slug, collegeSlug))
      .limit(1)

    let collegeId: string
    if (existing.length) {
      collegeId = existing[0].id
      console.log(`  skip (exists): ${col.name}`)
    } else {
      const [inserted] = await db
        .insert(schema.colleges)
        .values({
          userId,
          name: col.name,
          slug: collegeSlug,
          city: col.city,
          state: col.state,
          nirfRank: col.nirfRank,
          category: col.category,
          collegeType: col.collegeType,
          verificationStatus: 'approved',
        })
        .returning({ id: schema.colleges.id })

      collegeId = inserted.id
      collegesInserted++
      console.log(`  inserted: ${col.name}`)
    }

    for (const course of col.courses) {
      await db
        .insert(schema.courses)
        .values({
          collegeId,
          name: course.name,
          degree: course.degree,
          duration: course.duration,
          courseLevel: course.courseLevel,
          stream: course.stream,
          annualFee: String(course.annualFee),
          totalFee: String(course.annualFee * course.duration),
          seats: 60,
        })

      coursesInserted++
    }
  }

  console.log(`\nDone. ${collegesInserted} colleges, ${coursesInserted} courses inserted.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
