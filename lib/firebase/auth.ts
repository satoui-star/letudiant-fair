import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  type User,
  type Unsubscribe,
} from 'firebase/auth'
import app from './config'

export const auth = getAuth(app)

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  return signInWithPopup(auth, provider)
}

export async function signOut(): Promise<void> {
  return firebaseSignOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback)
}

export async function createAccount(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password)
}
