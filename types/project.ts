import { Timestamp } from 'firebase/firestore';

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string; // Firebase Auth UID of creator
  memberIds: string[]; // All member UIDs including owner — used in security rules
  inviteToken: string; // UUID v4, generated at project creation
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
