import { z } from 'zod'
import { emailSchema, phoneSchema } from '@/validators'

function emptyStringToUndefined(value: unknown) {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined
  }

  return value
}

export const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be under 100 characters'),
  email: emailSchema,
  phone: z.preprocess(
    emptyStringToUndefined,
    phoneSchema.optional()
  ),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(1000, 'Message must be under 1000 characters'),
  collegeId: z.uuid('Invalid college selected'),
})

export const collegeEnquiryFilterSchema = z.object({
  filter: z.enum(['all', 'unread']).default('all'),
})

export const markEnquiryReadSchema = z.object({
  read: z.boolean(),
})

export type EnquiryInput = z.input<typeof enquirySchema>
export type EnquiryData = z.output<typeof enquirySchema>
