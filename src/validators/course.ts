import { z } from 'zod'

export const COURSE_LEVELS = [
  'ug',
  'pg',
  'doctorate',
  'diploma',
  'certification',
] as const

function emptyStringToUndefined(value: unknown) {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined
  }

  return value
}

export const courseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Course name is required')
    .max(255, 'Course name must be under 255 characters'),
  degree: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(100, 'Degree must be under 100 characters').optional()
  ),
  duration: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number()
      .int('Duration must be a whole number')
      .positive('Duration must be greater than 0')
      .max(12, 'Duration looks too high')
      .optional()
  ),
  courseLevel: z.preprocess(
    emptyStringToUndefined,
    z.enum(COURSE_LEVELS).optional()
  ),
  stream: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(100, 'Stream must be under 100 characters').optional()
  ),
  totalFee: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number()
      .positive('Total fee must be greater than 0')
      .max(100000000, 'Total fee looks too high')
      .optional()
  ),
  annualFee: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number()
      .positive('Annual fee must be greater than 0')
      .max(100000000, 'Annual fee looks too high')
      .optional()
  ),
  seats: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number()
      .int('Seats must be a whole number')
      .nonnegative('Seats cannot be negative')
      .max(100000, 'Seats looks too high')
      .optional()
  ),
  placementPercent: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number()
      .min(0, 'Placement percent cannot be negative')
      .max(100, 'Placement percent must be 100 or less')
      .optional()
  ),
  avgPackage: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number()
      .positive('Average package must be greater than 0')
      .max(1000, 'Average package looks too high')
      .optional()
  ),
})

export type CourseInput = z.input<typeof courseSchema>
export type CourseData = z.output<typeof courseSchema>
