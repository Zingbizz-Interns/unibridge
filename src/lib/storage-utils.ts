import { storageAdmin } from '@/lib/storage'

export function getStoragePublicUrl(bucket: string, path: string) {
  return storageAdmin.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

export async function getStorageReadableUrl(
  bucket: string | null | undefined,
  path: string | null | undefined
) {
  if (!bucket || !path) {
    return null
  }

  const { data, error } = await storageAdmin.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 7)

  if (!error && data?.signedUrl) {
    return data.signedUrl
  }

  return getStoragePublicUrl(bucket, path)
}

export async function removeStorageObjects(bucket: string, paths: Array<string | null | undefined>) {
  const filteredPaths = paths.filter((path): path is string => Boolean(path))

  if (filteredPaths.length === 0) {
    return
  }

  const { error } = await storageAdmin.storage.from(bucket).remove(filteredPaths)

  if (error) {
    throw error
  }
}
