import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { User } from '@/types';

export async function createUserDocument(
  uid: string,
  data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const userRef = doc(db, 'users', uid);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef);

    if (!snap.exists()) {
      transaction.set(userRef, {
        ...data,
        id: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      transaction.update(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    }
  });
}
