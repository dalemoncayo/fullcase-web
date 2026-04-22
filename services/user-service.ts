import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { User } from '@/types';

export async function createUserDocument(
  uid: string,
  data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    ...data,
    id: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
