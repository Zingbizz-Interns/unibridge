import { z } from 'zod'
import { publicDocumentTypes } from '@/lib/college-content'

export const publicDocumentSchema = z.object({
  type: z.enum(publicDocumentTypes),
  fileName: z.string().trim().min(1, 'File name is required').max(500, 'File name must be under 500 characters'),
  storagePath: z.string().trim().min(1, 'Storage path is required'),
})

export type PublicDocumentInput = z.input<typeof publicDocumentSchema>
export type PublicDocumentData = z.output<typeof publicDocumentSchema>
