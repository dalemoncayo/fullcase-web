import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { User } from '@/types';

export async function createUserDocument(
  uid: string,
  data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const userRef = doc(db, 'users', uid);

  // setDoc with merge: true creates the doc if it doesn't exist, and updates if it does.
  await setDoc(
    userRef,
    {
      ...data,
      id: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
