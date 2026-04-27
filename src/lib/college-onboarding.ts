const requiredVerificationDocumentTypes = new Set([
  'naac_certificate',
  'aicte_approval',
  'ugc_letter',
])

function hasText(value: string | null | undefined) {
  return Boolean(value && value.trim())
}

type CollegeProfileStatus = {
  name: string
  collegeType: string | null
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended' | null
}

export function isCollegeProfileComplete(college: CollegeProfileStatus) {
  return hasText(college.name) && hasText(college.collegeType)
}

export function hasRequiredVerificationDocument(documentTypes: string[]) {
  return documentTypes.some((type) => requiredVerificationDocumentTypes.has(type))
}

export function needsCollegeOnboarding(
  college: CollegeProfileStatus,
  documentTypes: string[]
) {
  if (college.verificationStatus !== 'pending') {
    return false
  }

  return (
    !isCollegeProfileComplete(college)
    || !hasRequiredVerificationDocument(documentTypes)
  )
}
