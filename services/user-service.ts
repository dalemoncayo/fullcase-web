import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { User } from '@/types';

export async function createUserDocument(
  uid: string,
  data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      ...data,
      id: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }
}
