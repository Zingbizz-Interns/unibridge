import { z } from 'zod'

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(1, 'Email is required')

export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be under 100 characters')

export const fileSizeSchema = (maxMB: number) =>
  z
    .number()
    .max(maxMB * 1024 * 1024, `File size must be under ${maxMB}MB`)

export const fileTypeSchema = (allowedTypes: string[]) =>
  z.string().refine(
    (type) => allowedTypes.includes(type),
    `Allowed file types: ${allowedTypes.join(', ')}`
  )

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})
