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
  engineeringCutoff?: number
  medicalCutoff?: number
  courses: Array<{
    name: string
    degree: string
    duration: number   // years
    courseLevel: 'ug' | 'pg' | 'doctorate' | 'diploma' | 'certification'
    stream: string
    annualFee: number
  }>
}> = [
  // ── ENGINEERING (15) ──────────────────────────────────────────────────────
  {
    name: 'IIT Madras', city: 'Chennai', state: 'Tamil Nadu', nirfRank: 1,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 99.80,
    courses: [
      { name: 'B.Tech Computer Science', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 112000 },
      { name: 'B.Tech Mechanical Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Mechanical Engineering', annualFee: 112000 },
      { name: 'M.Tech VLSI Design', degree: 'M.Tech', duration: 2, courseLevel: 'pg', stream: 'Electronics Engineering', annualFee: 45000 },
    ],
  },
  {
    name: 'IIT Delhi', city: 'Delhi', state: 'Delhi', nirfRank: 2,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 99.60,
    courses: [
      { name: 'B.Tech Computer Science', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 110000 },
      { name: 'B.Tech Electrical Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Electrical Engineering', annualFee: 110000 },
    ],
  },
  {
    name: 'IIT Bombay', city: 'Mumbai', state: 'Maharashtra', nirfRank: 3,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 99.50,
    courses: [
      { name: 'B.Tech Computer Science', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 220000 },
      { name: 'B.Tech Chemical Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Chemical Engineering', annualFee: 220000 },
    ],
  },
  {
    name: 'IIT Kanpur', city: 'Kanpur', state: 'Uttar Pradesh', nirfRank: 4,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 99.40,
    courses: [
      { name: 'B.Tech Computer Science', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 108000 },
      { name: 'B.Tech Aerospace Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Aerospace Engineering', annualFee: 108000 },
    ],
  },
  {
    name: 'IIT Kharagpur', city: 'Kharagpur', state: 'West Bengal', nirfRank: 5,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 99.20,
    courses: [
      { name: 'B.Tech Civil Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Civil Engineering', annualFee: 105000 },
      { name: 'B.Tech Mining Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Mining Engineering', annualFee: 105000 },
    ],
  },
  {
    name: 'NIT Trichy', city: 'Tiruchirappalli', state: 'Tamil Nadu', nirfRank: 10,
    category: 'engineering', collegeType: 'autonomous', engineeringCutoff: 97.20,
    courses: [
      { name: 'B.Tech Computer Science', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 145000 },
      { name: 'B.Tech Mechanical Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Mechanical Engineering', annualFee: 145000 },
    ],
  },
  {
    name: 'NIT Warangal', city: 'Warangal', state: 'Telangana', nirfRank: 15,
    category: 'engineering', collegeType: 'autonomous', engineeringCutoff: 96.50,
    courses: [
      { name: 'B.Tech Electronics & Communication', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Electronics Engineering', annualFee: 140000 },
      { name: 'B.Tech Chemical Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Chemical Engineering', annualFee: 140000 },
    ],
  },
  {
    name: 'BITS Pilani', city: 'Pilani', state: 'Rajasthan', nirfRank: 25,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 96.00,
    courses: [
      { name: 'B.E. Computer Science', degree: 'B.E.', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 490000 },
      { name: 'B.E. Electrical & Electronics', degree: 'B.E.', duration: 4, courseLevel: 'ug', stream: 'Electrical Engineering', annualFee: 490000 },
    ],
  },
  {
    name: 'VIT Vellore', city: 'Vellore', state: 'Tamil Nadu', nirfRank: 20,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 95.00,
    courses: [
      { name: 'B.Tech Computer Science', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 198000 },
      { name: 'B.Tech Information Technology', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Information Technology', annualFee: 198000 },
    ],
  },
  {
    name: 'Jadavpur University', city: 'Kolkata', state: 'West Bengal', nirfRank: 18,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 96.00,
    courses: [
      { name: 'B.E. Computer Science', degree: 'B.E.', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 22000 },
      { name: 'B.E. Electronics & Telecom', degree: 'B.E.', duration: 4, courseLevel: 'ug', stream: 'Electronics Engineering', annualFee: 22000 },
    ],
  },
  {
    name: 'Delhi Technological University', city: 'Delhi', state: 'Delhi', nirfRank: 35,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 94.50,
    courses: [
      { name: 'B.Tech Computer Science', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 175000 },
      { name: 'B.Tech Software Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Software Engineering', annualFee: 175000 },
    ],
  },
  {
    name: 'COEP Technological University Pune', city: 'Pune', state: 'Maharashtra', nirfRank: 48,
    category: 'engineering', collegeType: 'autonomous', engineeringCutoff: 91.50,
    courses: [
      { name: 'B.Tech Mechanical Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Mechanical Engineering', annualFee: 112000 },
      { name: 'B.Tech Civil Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Civil Engineering', annualFee: 112000 },
    ],
  },
  {
    name: 'Thapar Institute of Engineering and Technology', city: 'Patiala', state: 'Punjab', nirfRank: 55,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 90.00,
    courses: [
      { name: 'B.E. Computer Engineering', degree: 'B.E.', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 315000 },
      { name: 'B.E. Electronics & Communication', degree: 'B.E.', duration: 4, courseLevel: 'ug', stream: 'Electronics Engineering', annualFee: 315000 },
    ],
  },
  {
    name: 'SRM Institute of Science and Technology', city: 'Chennai', state: 'Tamil Nadu', nirfRank: 50,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 89.00,
    courses: [
      { name: 'B.Tech Computer Science & Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 250000 },
      { name: 'B.Tech Biotechnology', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Biotechnology', annualFee: 250000 },
    ],
  },
  {
    name: 'Manipal Institute of Technology', city: 'Manipal', state: 'Karnataka', nirfRank: 80,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 85.00,
    courses: [
      { name: 'B.Tech Computer & Communication Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 275000 },
      { name: 'B.Tech Mechatronics', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Mechanical Engineering', annualFee: 275000 },
    ],
  },

  // ── MEDICAL (15) ──────────────────────────────────────────────────────────
  {
    name: 'AIIMS New Delhi', city: 'Delhi', state: 'Delhi', nirfRank: 1,
    category: 'medical', collegeType: 'university', medicalCutoff: 99.90,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 1628 },
      { name: 'MD Internal Medicine', degree: 'MD', duration: 3, courseLevel: 'pg', stream: 'Medicine', annualFee: 5000 },
    ],
  },
  {
    name: 'PGIMER Chandigarh', city: 'Chandigarh', state: 'Punjab', nirfRank: 2,
    category: 'medical', collegeType: 'university', medicalCutoff: 99.80,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 2000 },
      { name: 'MS General Surgery', degree: 'MS', duration: 3, courseLevel: 'pg', stream: 'Surgery', annualFee: 5000 },
    ],
  },
  {
    name: 'CMC Vellore', city: 'Vellore', state: 'Tamil Nadu', nirfRank: 3,
    category: 'medical', collegeType: 'autonomous', medicalCutoff: 99.75,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 75000 },
      { name: 'BDS', degree: 'BDS', duration: 5, courseLevel: 'ug', stream: 'Dentistry', annualFee: 95000 },
    ],
  },
  {
    name: 'AIIMS Bhopal', city: 'Bhopal', state: 'Madhya Pradesh', nirfRank: 4,
    category: 'medical', collegeType: 'university', medicalCutoff: 99.70,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 1628 },
      { name: 'B.Sc Nursing', degree: 'B.Sc', duration: 4, courseLevel: 'ug', stream: 'Nursing', annualFee: 15000 },
    ],
  },
  {
    name: 'JIPMER Puducherry', city: 'Puducherry', state: 'Puducherry', nirfRank: 5,
    category: 'medical', collegeType: 'university', medicalCutoff: 99.60,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 1000 },
    ],
  },
  {
    name: 'Maulana Azad Medical College', city: 'Delhi', state: 'Delhi', nirfRank: 7,
    category: 'medical', collegeType: 'affiliated', medicalCutoff: 99.40,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 28000 },
      { name: 'MD Pathology', degree: 'MD', duration: 3, courseLevel: 'pg', stream: 'Medicine', annualFee: 50000 },
    ],
  },
  {
    name: 'Madras Medical College', city: 'Chennai', state: 'Tamil Nadu', nirfRank: 9,
    category: 'medical', collegeType: 'affiliated', medicalCutoff: 99.10,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 28000 },
      { name: 'BDS', degree: 'BDS', duration: 5, courseLevel: 'ug', stream: 'Dentistry', annualFee: 35000 },
    ],
  },
  {
    name: 'Seth GS Medical College Mumbai', city: 'Mumbai', state: 'Maharashtra', nirfRank: 11,
    category: 'medical', collegeType: 'affiliated', medicalCutoff: 99.05,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 40000 },
      { name: 'MD Biochemistry', degree: 'MD', duration: 3, courseLevel: 'pg', stream: 'Medicine', annualFee: 60000 },
    ],
  },
  {
    name: 'Grant Medical College Mumbai', city: 'Mumbai', state: 'Maharashtra', nirfRank: 12,
    category: 'medical', collegeType: 'affiliated', medicalCutoff: 99.00,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 35000 },
    ],
  },
  {
    name: 'Bangalore Medical College and Research Institute', city: 'Bangalore', state: 'Karnataka', nirfRank: 15,
    category: 'medical', collegeType: 'affiliated', medicalCutoff: 98.80,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 30000 },
      { name: 'B.Sc Nursing', degree: 'B.Sc', duration: 4, courseLevel: 'ug', stream: 'Nursing', annualFee: 55000 },
    ],
  },
  {
    name: 'Kasturba Medical College Manipal', city: 'Manipal', state: 'Karnataka', nirfRank: 18,
    category: 'medical', collegeType: 'university', medicalCutoff: 98.50,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 1350000 },
      { name: 'BDS', degree: 'BDS', duration: 5, courseLevel: 'ug', stream: 'Dentistry', annualFee: 850000 },
    ],
  },
  {
    name: 'MS Ramaiah Medical College Bangalore', city: 'Bangalore', state: 'Karnataka', nirfRank: 22,
    category: 'medical', collegeType: 'autonomous', medicalCutoff: 98.20,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 950000 },
    ],
  },
  {
    name: 'Jawaharlal Nehru Medical College Belgaum', city: 'Belagavi', state: 'Karnataka', nirfRank: 28,
    category: 'medical', collegeType: 'affiliated', medicalCutoff: 97.80,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 550000 },
      { name: 'BPT', degree: 'BPT', duration: 4, courseLevel: 'ug', stream: 'Physiotherapy', annualFee: 120000 },
    ],
  },
  {
    name: 'Sri Ramachandra Medical College Chennai', city: 'Chennai', state: 'Tamil Nadu', nirfRank: 30,
    category: 'medical', collegeType: 'university', medicalCutoff: 97.50,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 1100000 },
      { name: 'BAMS', degree: 'BAMS', duration: 5, courseLevel: 'ug', stream: 'Ayurveda', annualFee: 250000 },
    ],
  },
  {
    name: 'PSG Institute of Medical Sciences Coimbatore', city: 'Coimbatore', state: 'Tamil Nadu', nirfRank: 35,
    category: 'medical', collegeType: 'autonomous', medicalCutoff: 97.20,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 750000 },
      { name: 'BDS', degree: 'BDS', duration: 5, courseLevel: 'ug', stream: 'Dentistry', annualFee: 550000 },
    ],
  },

  // ── ARTS & SCIENCE (10) ───────────────────────────────────────────────────
  {
    name: 'Miranda House Delhi', city: 'Delhi', state: 'Delhi', nirfRank: 1,
    category: 'arts_science', collegeType: 'affiliated',
    courses: [
      { name: 'BA Honours English', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'English', annualFee: 15000 },
      { name: 'B.Sc Physics Honours', degree: 'B.Sc', duration: 3, courseLevel: 'ug', stream: 'Physics', annualFee: 15000 },
    ],
  },
  {
    name: 'Lady Shri Ram College Delhi', city: 'Delhi', state: 'Delhi', nirfRank: 2,
    category: 'arts_science', collegeType: 'affiliated',
    courses: [
      { name: 'BA Honours Economics', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'Economics', annualFee: 18000 },
      { name: 'BA Honours Psychology', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'Psychology', annualFee: 18000 },
    ],
  },
  {
    name: 'Hindu College Delhi', city: 'Delhi', state: 'Delhi', nirfRank: 3,
    category: 'arts_science', collegeType: 'affiliated',
    courses: [
      { name: 'BA Honours History', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'History', annualFee: 12000 },
      { name: 'B.Sc Chemistry Honours', degree: 'B.Sc', duration: 3, courseLevel: 'ug', stream: 'Chemistry', annualFee: 12000 },
    ],
  },
  {
    name: 'Loyola College Chennai', city: 'Chennai', state: 'Tamil Nadu', nirfRank: 5,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'BA Economics', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'Economics', annualFee: 22000 },
      { name: 'B.Sc Mathematics', degree: 'B.Sc', duration: 3, courseLevel: 'ug', stream: 'Mathematics', annualFee: 22000 },
    ],
  },
  {
    name: "St Xavier's College Mumbai", city: 'Mumbai', state: 'Maharashtra', nirfRank: 8,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'BA Sociology', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'Sociology', annualFee: 28000 },
      { name: 'B.Sc Life Sciences', degree: 'B.Sc', duration: 3, courseLevel: 'ug', stream: 'Life Sciences', annualFee: 28000 },
    ],
  },
  {
    name: 'Madras Christian College', city: 'Chennai', state: 'Tamil Nadu', nirfRank: 10,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'BA English', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'English', annualFee: 20000 },
      { name: 'B.Sc Zoology', degree: 'B.Sc', duration: 3, courseLevel: 'ug', stream: 'Zoology', annualFee: 20000 },
    ],
  },
  {
    name: 'Presidency College Chennai', city: 'Chennai', state: 'Tamil Nadu', nirfRank: 12,
    category: 'arts_science', collegeType: 'affiliated',
    courses: [
      { name: 'BA History', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'History', annualFee: 8000 },
      { name: 'B.Sc Statistics', degree: 'B.Sc', duration: 3, courseLevel: 'ug', stream: 'Statistics', annualFee: 8000 },
    ],
  },
  {
    name: 'Christ University Bangalore', city: 'Bangalore', state: 'Karnataka', nirfRank: 15,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'BA English Honours', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'English', annualFee: 85000 },
      { name: 'B.Sc Data Science', degree: 'B.Sc', duration: 3, courseLevel: 'ug', stream: 'Data Science', annualFee: 95000 },
    ],
  },
  {
    name: 'Fergusson College Pune', city: 'Pune', state: 'Maharashtra', nirfRank: 18,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'BA Political Science', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'Political Science', annualFee: 15000 },
      { name: 'B.Sc Biotechnology', degree: 'B.Sc', duration: 3, courseLevel: 'ug', stream: 'Biotechnology', annualFee: 18000 },
    ],
  },
  {
    name: 'Stella Maris College Chennai', city: 'Chennai', state: 'Tamil Nadu', nirfRank: 22,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'BA Social Work', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'Social Work', annualFee: 25000 },
      { name: 'B.Sc Computer Science', degree: 'B.Sc', duration: 3, courseLevel: 'ug', stream: 'Computer Science', annualFee: 25000 },
    ],
  },

  // ── MANAGEMENT (10) ───────────────────────────────────────────────────────
  {
    name: 'IIM Ahmedabad', city: 'Ahmedabad', state: 'Gujarat', nirfRank: 1,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'Post Graduate Programme in Management', degree: 'PGDM', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 1100000 },
      { name: 'Fellow Programme in Management', degree: 'FPM', duration: 4, courseLevel: 'doctorate', stream: 'Management', annualFee: 100000 },
    ],
  },
  {
    name: 'IIM Bangalore', city: 'Bangalore', state: 'Karnataka', nirfRank: 2,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'Post Graduate Programme in Management', degree: 'PGDM', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 1100000 },
    ],
  },
  {
    name: 'IIM Calcutta', city: 'Kolkata', state: 'West Bengal', nirfRank: 3,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'MBA', degree: 'MBA', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 1050000 },
    ],
  },
  {
    name: 'IIM Lucknow', city: 'Lucknow', state: 'Uttar Pradesh', nirfRank: 5,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'Post Graduate Programme in Management', degree: 'PGDM', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 1050000 },
    ],
  },
  {
    name: 'XLRI Jamshedpur', city: 'Jamshedpur', state: 'Jharkhand', nirfRank: 8,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'MBA Business Management', degree: 'MBA', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 1140000 },
      { name: 'MBA Human Resource Management', degree: 'MBA', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 1140000 },
    ],
  },
  {
    name: 'SPJIMR Mumbai', city: 'Mumbai', state: 'Maharashtra', nirfRank: 10,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'PGDM', degree: 'PGDM', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 1050000 },
      { name: 'BBA', degree: 'BBA', duration: 3, courseLevel: 'ug', stream: 'Management', annualFee: 150000 },
    ],
  },
  {
    name: 'MDI Gurgaon', city: 'Gurgaon', state: 'Haryana', nirfRank: 12,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'PGDM', degree: 'PGDM', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 2300000 },
    ],
  },
  {
    name: 'NMIMS Mumbai', city: 'Mumbai', state: 'Maharashtra', nirfRank: 15,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'MBA', degree: 'MBA', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 1400000 },
      { name: 'BBA', degree: 'BBA', duration: 3, courseLevel: 'ug', stream: 'Management', annualFee: 280000 },
    ],
  },
  {
    name: 'Symbiosis Institute of Business Management Pune', city: 'Pune', state: 'Maharashtra', nirfRank: 25,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'MBA', degree: 'MBA', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 1300000 },
    ],
  },
  {
    name: 'IMT Ghaziabad', city: 'Ghaziabad', state: 'Uttar Pradesh', nirfRank: 20,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'PGDM', degree: 'PGDM', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 1600000 },
      { name: 'Executive PGDM', degree: 'PGDM', duration: 1, courseLevel: 'pg', stream: 'Management', annualFee: 1200000 },
    ],
  },

  // ── COMMERCE (8) ─────────────────────────────────────────────────────────
  {
    name: 'SRCC Delhi', city: 'Delhi', state: 'Delhi', nirfRank: 1,
    category: 'arts_science', collegeType: 'affiliated',
    courses: [
      { name: 'B.Com (Honours)', degree: 'B.Com', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 16000 },
      { name: 'M.Com', degree: 'M.Com', duration: 2, courseLevel: 'pg', stream: 'Commerce', annualFee: 20000 },
    ],
  },
  {
    name: 'Hindu Commerce College Delhi', city: 'Delhi', state: 'Delhi', nirfRank: 3,
    category: 'arts_science', collegeType: 'affiliated',
    courses: [
      { name: 'B.Com (Honours)', degree: 'B.Com', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 14000 },
    ],
  },
  {
    name: 'Christ University Commerce Bangalore', city: 'Bangalore', state: 'Karnataka', nirfRank: 5,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'B.Com (Professional)', degree: 'B.Com', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 65000 },
      { name: 'M.Com', degree: 'M.Com', duration: 2, courseLevel: 'pg', stream: 'Commerce', annualFee: 75000 },
    ],
  },
  {
    name: 'Narsee Monjee College Mumbai', city: 'Mumbai', state: 'Maharashtra', nirfRank: 8,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'B.Com (Accounting & Finance)', degree: 'B.Com', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 32000 },
      { name: 'B.Com (Financial Markets)', degree: 'B.Com', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 32000 },
    ],
  },
  {
    name: 'Loyola College Commerce Chennai', city: 'Chennai', state: 'Tamil Nadu', nirfRank: 10,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'B.Com General', degree: 'B.Com', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 22000 },
      { name: 'BBA', degree: 'BBA', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 28000 },
    ],
  },
  {
    name: 'Jai Hind College Mumbai', city: 'Mumbai', state: 'Maharashtra', nirfRank: 12,
    category: 'arts_science', collegeType: 'affiliated',
    courses: [
      { name: 'B.Com (Commerce)', degree: 'B.Com', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 25000 },
      { name: 'BMS', degree: 'BMS', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 30000 },
    ],
  },
  {
    name: 'HR College of Commerce Mumbai', city: 'Mumbai', state: 'Maharashtra', nirfRank: 15,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'B.Com (Accounting)', degree: 'B.Com', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 28000 },
    ],
  },
  {
    name: 'Bishop Heber College Tiruchirappalli', city: 'Tiruchirappalli', state: 'Tamil Nadu', nirfRank: 20,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'B.Com General', degree: 'B.Com', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 18000 },
      { name: 'BBA', degree: 'BBA', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 22000 },
    ],
  },

  // ── LAW (8) ───────────────────────────────────────────────────────────────
  {
    name: 'National Law School of India University', city: 'Bangalore', state: 'Karnataka', nirfRank: 1,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'BA LLB (Hons.)', degree: 'BA LLB', duration: 5, courseLevel: 'ug', stream: 'Law', annualFee: 217000 },
      { name: 'LLM', degree: 'LLM', duration: 1, courseLevel: 'pg', stream: 'Law', annualFee: 80000 },
    ],
  },
  {
    name: 'NALSAR University of Law', city: 'Hyderabad', state: 'Telangana', nirfRank: 2,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'BA LLB (Hons.)', degree: 'BA LLB', duration: 5, courseLevel: 'ug', stream: 'Law', annualFee: 195000 },
    ],
  },
  {
    name: 'National Law University Delhi', city: 'Delhi', state: 'Delhi', nirfRank: 3,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'BA LLB', degree: 'BA LLB', duration: 5, courseLevel: 'ug', stream: 'Law', annualFee: 204000 },
      { name: 'LLM', degree: 'LLM', duration: 1, courseLevel: 'pg', stream: 'Law', annualFee: 75000 },
    ],
  },
  {
    name: 'Campus Law Centre Delhi', city: 'Delhi', state: 'Delhi', nirfRank: 4,
    category: 'arts_science', collegeType: 'affiliated',
    courses: [
      { name: 'LLB (3 Year)', degree: 'LLB', duration: 3, courseLevel: 'ug', stream: 'Law', annualFee: 12000 },
      { name: 'LLM', degree: 'LLM', duration: 1, courseLevel: 'pg', stream: 'Law', annualFee: 15000 },
    ],
  },
  {
    name: 'National Law University Jodhpur', city: 'Jodhpur', state: 'Rajasthan', nirfRank: 5,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'BA LLB (Hons.)', degree: 'BA LLB', duration: 5, courseLevel: 'ug', stream: 'Law', annualFee: 230000 },
    ],
  },
  {
    name: 'Symbiosis Law School Pune', city: 'Pune', state: 'Maharashtra', nirfRank: 8,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'BA LLB', degree: 'BA LLB', duration: 5, courseLevel: 'ug', stream: 'Law', annualFee: 280000 },
      { name: 'BBA LLB', degree: 'BBA LLB', duration: 5, courseLevel: 'ug', stream: 'Law', annualFee: 280000 },
    ],
  },
  {
    name: 'Amity Law School Delhi', city: 'Delhi', state: 'Delhi', nirfRank: 10,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'BA LLB (Hons.)', degree: 'BA LLB', duration: 5, courseLevel: 'ug', stream: 'Law', annualFee: 195000 },
      { name: 'LLM', degree: 'LLM', duration: 1, courseLevel: 'pg', stream: 'Law', annualFee: 180000 },
    ],
  },
  {
    name: 'ILS Law College Pune', city: 'Pune', state: 'Maharashtra', nirfRank: 12,
    category: 'arts_science', collegeType: 'affiliated',
    courses: [
      { name: 'LLB (3 Year)', degree: 'LLB', duration: 3, courseLevel: 'ug', stream: 'Law', annualFee: 22000 },
      { name: 'BA LLB (5 Year)', degree: 'BA LLB', duration: 5, courseLevel: 'ug', stream: 'Law', annualFee: 22000 },
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
          engineeringCutoff: col.engineeringCutoff !== undefined ? String(col.engineeringCutoff) : undefined,
          medicalCutoff: col.medicalCutoff !== undefined ? String(col.medicalCutoff) : undefined,
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
