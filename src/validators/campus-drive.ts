import { z } from 'zod'

function emptyStringToUndefined(value: unknown) {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined
  }

  return value
}

function isValidDateString(value: string) {
  return !Number.isNaN(Date.parse(value))
}

export const campusDriveSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required').max(255, 'Company name must be under 255 characters'),
  role: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(255, 'Role must be under 255 characters').optional()
  ),
  ctc: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().positive('CTC must be greater than 0').max(9999, 'CTC looks too high').optional()
  ),
  driveDate: z
    .string()
    .trim()
    .min(1, 'Drive date is required')
    .refine(isValidDateString, 'Enter a valid drive date'),
  studentsPlaced: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int('Students placed must be a whole number').nonnegative('Students placed cannot be negative').max(10000, 'Students placed looks too high').optional()
  ),
})

export type CampusDriveInput = z.input<typeof campusDriveSchema>
export type CampusDriveData = z.output<typeof campusDriveSchema>
