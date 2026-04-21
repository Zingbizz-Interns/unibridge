import { z } from 'zod'
import { phoneSchema } from '@/validators'

export const COLLEGE_CATEGORIES = [
  'engineering',
  'medical',
  'arts_science',
] as const

export const COLLEGE_TYPES_NEW = [
  'affiliated',
  'university',
  'autonomous',
] as const

export const COLLEGE_TYPES = [
  'Engineering',
  'Medical',
  'Arts',
  'Commerce',
  'Science',
  'Law',
  'Management',
  'Other',
] as const

export const NAAC_GRADES = [
  'A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', 'Not Accredited',
] as const

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
] as const

function emptyValueToUndefined(value: unknown) {
  if (value === null || value === undefined) {
    return undefined
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? undefined : trimmed
  }

  return value
}

const optionalString = z.preprocess(
  emptyValueToUndefined,
  z.string().max(500).optional()
)

const optionalNumber = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(emptyValueToUndefined, schema)

export const collegeProfileSchema = z
  .object({
    name: z.string().trim().min(1, 'College name is required').max(500),
    category: z.preprocess(
      emptyValueToUndefined,
      z.enum(COLLEGE_CATEGORIES).optional()
    ),
    collegeType: z.preprocess(
      emptyValueToUndefined,
      z.enum(COLLEGE_TYPES_NEW).optional()
    ),
    type: z.preprocess(
      emptyValueToUndefined,
      z.enum(COLLEGE_TYPES).optional()
    ),
    city: z.preprocess(
      emptyValueToUndefined,
      z.string().max(100).optional()
    ),
    state: z.preprocess(
      emptyValueToUndefined,
      z.enum(INDIAN_STATES).optional()
    ),
    pincode: z.preprocess(
      emptyValueToUndefined,
      z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits').optional()
    ),
    affiliation: z.preprocess(
      emptyValueToUndefined,
      z.string().max(255).optional()
    ),
    naacGrade: z.preprocess(
      emptyValueToUndefined,
      z.enum(NAAC_GRADES).optional()
    ),
    nirfRank: optionalNumber(
      z.coerce.number().int().positive('NIRF rank must be a positive number').optional()
    ),
    engineeringCutoff: optionalNumber(
      z.coerce.number().min(0, 'Engineering cut-off must be between 0 and 200').max(200, 'Engineering cut-off must be between 0 and 200').optional()
    ),
    medicalCutoff: optionalNumber(
      z.coerce.number().min(0, 'Medical cut-off must be between 0 and 200').max(200, 'Medical cut-off must be between 0 and 200').optional()
    ),
    website: z.preprocess(
      emptyValueToUndefined,
      z.string().url('Must be a valid URL (include https://)').optional()
    ),
    description: optionalString,
    counsellorEmail: z.preprocess(
      emptyValueToUndefined,
      z.string().email('Invalid counsellor email').optional()
    ),
    counsellorPhone: z.preprocess(
      emptyValueToUndefined,
      phoneSchema.optional()
    ),
    latitude: optionalNumber(
      z.coerce.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').optional()
    ),
    longitude: optionalNumber(
      z.coerce.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180').optional()
    ),
  })
  .superRefine((data, ctx) => {
    const hasLatitude = typeof data.latitude === 'number'
    const hasLongitude = typeof data.longitude === 'number'

    if (hasLatitude !== hasLongitude) {
      ctx.addIssue({
        code: 'custom',
        path: [hasLatitude ? 'longitude' : 'latitude'],
        message: 'Enter both latitude and longitude.',
      })
    }
  })

export type CollegeProfileInput = z.input<typeof collegeProfileSchema>
export type CollegeProfileData = z.output<typeof collegeProfileSchema>
