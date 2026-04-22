import { FirebaseError } from 'firebase/app';
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

function handleAuthError(error: unknown, fallbackMessage: string): never {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        throw new Error('An account with this email already exists.');
      case 'auth/invalid-email':
        throw new Error('Invalid email address.');
      case 'auth/user-disabled':
        throw new Error('This account has been disabled.');
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        throw new Error('Invalid email or password. Please try again.');
      case 'auth/too-many-requests':
        throw new Error('Too many attempts. Please try again later.');
      case 'auth/popup-closed-by-user':
        throw new Error('Sign in was cancelled.');
      default:
        throw new Error(fallbackMessage);
    }
  }
  throw new Error(fallbackMessage);
}

export async function signInWithEmail(email: string, password: string) {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    return handleAuthError(
      error,
      'Invalid email or password. Please try again.',
    );
  }
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const credential = await signInWithPopup(auth, provider);
    try {
      await createUserDocument(credential.user.uid, {
        email: credential.user.email || '',
        displayName: credential.user.displayName || 'User',
        photoURL: credential.user.photoURL || null,
      });
    } catch (dbError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(
          'Failed to upsert user document for Google sign in:',
          dbError,
        );
      }
      // Non-blocking: we swallow the error so auth isn't blocked.
    }
    return credential;
  } catch (error) {
    return handleAuthError(error, 'Google sign in failed. Please try again.');
  }
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
) {
  try {
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
  } catch (error) {
    return handleAuthError(error, 'Registration failed. Please try again.');
  }
}

export async function logOut() {
  return signOut(auth);
}
