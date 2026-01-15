import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { PlanningRightsObject, TamhilOutput } from '../types';

// Project interface for saved projects
export interface Project {
  id?: string;
  userId: string;
  name: string;
  gush: string;
  helka: string;
  currentStep: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  // Stage 1 data
  tabaData?: PlanningRightsObject | null;
  tabaReport?: string | null;
  // Stage 2 data
  tamhilData?: TamhilOutput | null;
  // Future stages
  massingData?: any | null;
  visualizationData?: any | null;
}

const COLLECTION_NAME = 'projects';

// Get all projects for a user
export const getUserProjects = async (userId: string): Promise<Project[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Project));
};

// Get a single project by ID
export const getProject = async (projectId: string): Promise<Project | null> => {
  const docRef = doc(db, COLLECTION_NAME, projectId);
  const snapshot = await getDoc(docRef);
  
  if (!snapshot.exists()) return null;
  
  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Project;
};

// Create a new project
export const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...project,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return docRef.id;
};

// Update an existing project
export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, projectId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// Delete a project
export const deleteProject = async (projectId: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, projectId);
  await deleteDoc(docRef);
};

// Helper: Format timestamp for display
export const formatProjectDate = (timestamp: Timestamp | undefined): string => {
  if (!timestamp) return 'Unknown';
  const date = timestamp.toDate();
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
