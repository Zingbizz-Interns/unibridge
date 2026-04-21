import { z } from 'zod'

function emptyStringToUndefined(value: unknown) {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined
  }

  return value
}

export const createSuccessStorySchema = z.object({
  studentName: z.string().trim().min(2, 'Student name is required').max(255, 'Student name must be under 255 characters'),
  batch: z.string().trim().regex(/^\d{4}$/, 'Batch year must be a 4-digit year'),
  company: z.string().trim().min(1, 'Company name is required').max(255, 'Company name must be under 255 characters'),
  role: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(255, 'Role must be under 255 characters').optional()
  ),
  ctc: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().positive('CTC must be greater than 0').max(9999, 'CTC looks too high').optional()
  ),
  story: z.string().trim().min(20, 'Story must be at least 20 characters').max(2000, 'Story must be under 2000 characters'),
  imagePath: z.string().trim().min(1, 'Student photo upload is required'),
})

export const updateSuccessStorySchema = createSuccessStorySchema.extend({
  imagePath: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).optional()
  ),
})

export type CreateSuccessStoryInput = z.input<typeof createSuccessStorySchema>
export type CreateSuccessStoryData = z.output<typeof createSuccessStorySchema>
export type UpdateSuccessStoryInput = z.input<typeof updateSuccessStorySchema>
export type UpdateSuccessStoryData = z.output<typeof updateSuccessStorySchema>
