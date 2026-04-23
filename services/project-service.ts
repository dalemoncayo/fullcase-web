import {
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { generateToken } from '@/lib/utils';
import type { Project } from '@/types';

export async function createProject(
  data: Pick<Project, 'name' | 'description'>,
  user: {
    id: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  },
): Promise<string> {
  const batch = writeBatch(db);

  // Create a new project document reference with an auto-generated ID
  const projectRef = doc(collection(db, 'projects'));
  const projectId = projectRef.id;

  const projectData = {
    ...data,
    ownerId: user.id,
    memberIds: [user.id],
    inviteToken: generateToken(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  batch.set(projectRef, projectData);

  // Create the owner as the first member
  const memberRef = doc(db, 'projects', projectId, 'members', user.id);
  batch.set(memberRef, {
    userId: user.id,
    displayName: user.displayName || 'Anonymous',
    email: user.email || '',
    photoURL: user.photoURL,
    joinedAt: serverTimestamp(),
  });

  await batch.commit();
  return projectId;
}
export async function deleteProject(projectId: string): Promise<void> {
  await deleteDoc(doc(db, 'projects', projectId));
}
