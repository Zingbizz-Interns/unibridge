export const COLLEGE_IMAGE_MAX_SIZE = 5 * 1024 * 1024
export const COLLEGE_IMAGE_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function uploadCollegeImage(
  file: File,
  folder: 'logos' | 'banners'
): Promise<string> {
  const signRes = await fetch('/api/storage/sign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      bucket: 'publicDocuments',
      folder,
    }),
  })

  if (!signRes.ok) {
    const { error } = await signRes.json()
    throw new Error(error ?? 'Failed to get upload URL')
  }

  const { signedUrl, publicUrl } = await signRes.json()

  const uploadRes = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })

  if (!uploadRes.ok) throw new Error('Upload to storage failed')

  return publicUrl as string
}

export async function saveCollegeImageUrl(
  field: 'logoUrl' | 'bannerUrl',
  url: string
): Promise<void> {
  const res = await fetch('/api/college/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [field]: url }),
  })

  if (!res.ok) {
    const { error } = await res.json()
    throw new Error(error ?? 'Failed to save image URL')
  }
}
