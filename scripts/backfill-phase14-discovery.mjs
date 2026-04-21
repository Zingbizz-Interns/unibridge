import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import dotenv from 'dotenv'
import { neon } from '@neondatabase/serverless'

dotenv.config({ path: '.env.local' })

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing. Check .env.local')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function getSnapshot() {
  const [collegesSummary, coursesSummary, categoryDistribution, collegeTypeDistribution, courseLevelDistribution] = await Promise.all([
    sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE category IS NULL)::int AS missing_category,
        COUNT(*) FILTER (WHERE college_type IS NULL)::int AS missing_college_type
      FROM colleges
    `,
    sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE course_level IS NULL)::int AS missing_course_level,
        COUNT(*) FILTER (WHERE stream IS NULL OR trim(stream) = '')::int AS missing_stream
      FROM courses
    `,
    sql`
      SELECT COALESCE(category::text, 'null') AS value, COUNT(*)::int AS count
      FROM colleges
      GROUP BY category
      ORDER BY count DESC
    `,
    sql`
      SELECT COALESCE(college_type::text, 'null') AS value, COUNT(*)::int AS count
      FROM colleges
      GROUP BY college_type
      ORDER BY count DESC
    `,
    sql`
      SELECT COALESCE(course_level::text, 'null') AS value, COUNT(*)::int AS count
      FROM courses
      GROUP BY course_level
      ORDER BY count DESC
    `,
  ])

  return {
    colleges: collegesSummary[0],
    courses: coursesSummary[0],
    distributions: {
      category: categoryDistribution,
      collegeType: collegeTypeDistribution,
      courseLevel: courseLevelDistribution,
    },
  }
}

async function runBackfill() {
  const courseLevelResult = await sql`
    UPDATE courses
    SET course_level = CASE
      WHEN course_level IS NOT NULL THEN course_level
      WHEN lower(COALESCE(degree, '') || ' ' || COALESCE(name, '')) ~ '(phd|doctor)' THEN 'doctorate'::course_level
      WHEN lower(COALESCE(degree, '') || ' ' || COALESCE(name, '')) ~ '(m\\.?tech|m\\.?e\\.?|mba|mca|m\\.?sc|master|md|ms)' THEN 'pg'::course_level
      WHEN lower(COALESCE(degree, '') || ' ' || COALESCE(name, '')) ~ '(diploma|polytechnic)' THEN 'diploma'::course_level
      WHEN lower(COALESCE(degree, '') || ' ' || COALESCE(name, '')) ~ '(certificate|certification)' THEN 'certification'::course_level
      ELSE 'ug'::course_level
    END
    WHERE course_level IS NULL
    RETURNING id
  `

  const streamResult = await sql`
    UPDATE courses
    SET stream = COALESCE(
      NULLIF(trim(stream), ''),
      NULLIF(trim(regexp_replace(COALESCE(name, ''), '(?i)\\b(b\\.?tech|m\\.?tech|b\\.?e\\.?|m\\.?e\\.?|b\\.?sc|m\\.?sc|b\\.?a|m\\.?a|b\\.?com|m\\.?com|phd|doctorate|diploma|certificate)\\b', '', 'g')), ''),
      NULLIF(trim(degree), ''),
      'General'
    )
    WHERE stream IS NULL OR trim(stream) = ''
    RETURNING id
  `

  const categoryResult = await sql`
    UPDATE colleges c
    SET category = CASE
      WHEN lower(COALESCE(c.type, '')) LIKE '%engineering%' THEN 'engineering'::college_category
      WHEN lower(COALESCE(c.type, '')) LIKE '%medical%' THEN 'medical'::college_category
      WHEN lower(COALESCE(c.type, '')) LIKE '%arts%'
        OR lower(COALESCE(c.type, '')) LIKE '%science%'
        OR lower(COALESCE(c.type, '')) LIKE '%commerce%' THEN 'arts_science'::college_category
      WHEN EXISTS (
        SELECT 1 FROM courses cs
        WHERE cs.college_id = c.id
          AND lower(COALESCE(cs.stream, '') || ' ' || COALESCE(cs.name, '') || ' ' || COALESCE(cs.degree, ''))
            ~ '(engineering|computer|software|mechanical|civil|electronics|technology|it)'
      ) THEN 'engineering'::college_category
      WHEN EXISTS (
        SELECT 1 FROM courses cs
        WHERE cs.college_id = c.id
          AND lower(COALESCE(cs.stream, '') || ' ' || COALESCE(cs.name, '') || ' ' || COALESCE(cs.degree, ''))
            ~ '(medical|mbbs|nursing|pharma|dental|physiotherapy|biomedical)'
      ) THEN 'medical'::college_category
      ELSE 'arts_science'::college_category
    END
    WHERE c.category IS NULL
    RETURNING c.id
  `

  const collegeTypeResult = await sql`
    UPDATE colleges
    SET college_type = CASE
      WHEN lower(COALESCE(type, '')) LIKE '%autonomous%' THEN 'autonomous'::college_type
      WHEN lower(COALESCE(type, '')) LIKE '%university%' THEN 'university'::college_type
      WHEN lower(COALESCE(affiliation, '')) LIKE '%university%' THEN 'affiliated'::college_type
      ELSE 'affiliated'::college_type
    END
    WHERE college_type IS NULL
    RETURNING id
  `

  return {
    updatedCourseLevels: courseLevelResult.length,
    updatedStreams: streamResult.length,
    updatedCategories: categoryResult.length,
    updatedCollegeTypes: collegeTypeResult.length,
  }
}

async function main() {
  console.log('Phase 14 backfill started...')

  const before = await getSnapshot()
  const updates = await runBackfill()
  const after = await getSnapshot()

  const report = {
    generatedAt: new Date().toISOString(),
    updates,
    before,
    after,
  }

  const reportDir = join(process.cwd(), 'scripts', 'reports')
  const reportPath = join(reportDir, 'phase14-backfill-report.json')
  mkdirSync(reportDir, { recursive: true })
  writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log('Phase 14 backfill finished.')
  console.log(`Report written to: ${reportPath}`)
  console.log(JSON.stringify(updates, null, 2))
}

main().catch((error) => {
  console.error('Phase 14 backfill failed:', error)
  process.exit(1)
})
