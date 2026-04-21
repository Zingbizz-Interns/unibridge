export const verificationDocumentTypes = [
  'naac_certificate',
  'aicte_approval',
  'ugc_letter',
] as const

export const publicDocumentTypes = [
  'brochure',
  'mandatory_disclosure',
  'fee_structure',
  'accreditation',
  'other',
] as const

export const legacyPublicDocumentTypes = [
  'brochure',
  'disclosure',
  'mandatory_disclosure',
  'fee_structure',
  'accreditation',
  'other',
] as const

export type VerificationDocumentType = (typeof verificationDocumentTypes)[number]
export type PublicDocumentType = (typeof publicDocumentTypes)[number]
export type LegacyPublicDocumentType = (typeof legacyPublicDocumentTypes)[number]

export const verificationDocumentOptions: Array<{
  value: VerificationDocumentType
  label: string
}> = [
  { value: 'naac_certificate', label: 'NAAC certificate' },
  { value: 'aicte_approval', label: 'AICTE approval' },
  { value: 'ugc_letter', label: 'UGC letter' },
]

export const publicDocumentOptions: Array<{
  value: PublicDocumentType
  label: string
}> = [
  { value: 'brochure', label: 'Brochure' },
  { value: 'mandatory_disclosure', label: 'Mandatory disclosure' },
  { value: 'fee_structure', label: 'Fee structure' },
  { value: 'accreditation', label: 'Accreditation' },
  { value: 'other', label: 'Other public document' },
]

export function isVerificationDocumentType(value: string): value is VerificationDocumentType {
  return verificationDocumentTypes.includes(value as VerificationDocumentType)
}

export function isLegacyPublicDocumentType(value: string): value is LegacyPublicDocumentType {
  return legacyPublicDocumentTypes.includes(value as LegacyPublicDocumentType)
}

export function formatDocumentTypeLabel(value: string) {
  switch (value) {
    case 'naac_certificate':
      return 'NAAC certificate'
    case 'aicte_approval':
      return 'AICTE approval'
    case 'ugc_letter':
      return 'UGC letter'
    case 'mandatory_disclosure':
    case 'disclosure':
      return 'Mandatory disclosure'
    case 'fee_structure':
      return 'Fee structure'
    case 'accreditation':
      return 'Accreditation'
    case 'brochure':
      return 'Brochure'
    case 'other':
      return 'Other'
    default:
      return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
  }
}
