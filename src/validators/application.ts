import { z } from 'zod'
import { phoneSchema } from '@/validators'

const optionalTrimmedString = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value
    }

    const trimmed = value.trim()
    return trimmed === '' ? undefined : trimmed
  },
  z.string().max(100).optional()
)

const optionalNumber = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return null
    }

    return value
  },
  z.coerce.number().nullable().optional()
)

export const applicationSchema = z
  .object({
    collegeId: z.string().uuid('Invalid college ID'),
    courseId: z.string().uuid('Please select a valid course'),
    dob: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
    gender: z.enum(['male', 'female', 'other'], {
      message: 'Please select a gender',
    }),
    category: z.enum(['general', 'obc', 'sc', 'st', 'ews'], {
      message: 'Please select a category',
    }),
    phone: phoneSchema,
    tenthPercent: z.coerce
      .number()
      .min(0)
      .max(100, 'Tenth percentage cannot exceed 100'),
    twelfthPercent: z.coerce
      .number()
      .min(0)
      .max(100, 'Twelfth percentage cannot exceed 100'),
    entranceExam: optionalTrimmedString,
    entranceScore: optionalNumber,
    address: z.string().trim().min(5, 'Address is too short'),
    city: z.string().trim().min(2, 'City name is required'),
    state: z.string().trim().min(2, 'State name is required'),
    pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  })
  .superRefine((value, ctx) => {
    if (
      value.entranceScore !== null &&
      value.entranceScore !== undefined &&
      !value.entranceExam
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Entrance exam name is required when a score is provided',
        path: ['entranceExam'],
      })
    }
  })

export type ApplicationFormInput = z.input<typeof applicationSchema>
export type ApplicationFormData = z.output<typeof applicationSchema>
