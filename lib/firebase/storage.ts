import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import app from './config'

export const storage = getStorage(app)

export async function uploadFile(path: string, file: File): Promise<string> {
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

export async function uploadReel(schoolId: string, file: File): Promise<string> {
  return uploadFile(`schools/${schoolId}/reel_${Date.now()}`, file)
}

export async function uploadCover(schoolId: string, file: File): Promise<string> {
  return uploadFile(`schools/${schoolId}/cover_${Date.now()}`, file)
}
