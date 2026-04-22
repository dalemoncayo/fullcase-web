import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { createUserDocument } from '@/services/user-service';

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  try {
    await createUserDocument(credential.user.uid, {
      email: credential.user.email || '',
      displayName: credential.user.displayName || 'User',
      photoURL: credential.user.photoURL || null,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        'Failed to upsert user document for Google sign in:',
        error,
      );
    }
    // Non-blocking: we swallow the error so auth isn't blocked.
  }
  return credential;
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  try {
    await updateProfile(credential.user, { displayName });

    await createUserDocument(credential.user.uid, {
      email,
      displayName,
      photoURL: null,
    });
  } catch (error) {
    try {
      await credential.user.delete();
    } catch {
      // cleanup failure — original error is re-thrown below
    }
    throw error;
  }

  return credential;
}

export async function logOut() {
  return signOut(auth);
}
