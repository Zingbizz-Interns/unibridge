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
  category: string | null
  collegeType: string | null
  type: string | null
  city: string | null
  state: string | null
  pincode: string | null
  affiliation: string | null
  website: string | null
  description: string | null
  counsellorEmail: string | null
  counsellorPhone: string | null
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended' | null
}

export function isCollegeProfileComplete(college: CollegeProfileStatus) {
  return [
    college.name,
    college.category,
    college.collegeType,
    college.city,
    college.state,
    college.pincode,
    college.affiliation,
    college.website,
    college.description,
    college.counsellorEmail,
    college.counsellorPhone,
  ].every(hasText)
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
