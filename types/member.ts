import { Timestamp } from 'firebase/firestore';

export interface Member {
  userId: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  joinedAt: Timestamp;
}
