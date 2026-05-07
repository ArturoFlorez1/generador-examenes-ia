import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  serverTimestamp,
  setDoc,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Exam } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const examsService = {
  async getAll(): Promise<Exam[]> {
    const path = 'exams';
    try {
      const q = query(collection(db, path));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Exam));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getByUser(userId: string): Promise<Exam[]> {
    const path = 'exams';
    try {
      const q = query(collection(db, path), where('creatorId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Exam));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async save(exam: Omit<Exam, 'id'> & { id?: string }): Promise<string> {
    const path = 'exams';
    try {
      const examData = {
        ...exam,
        createdAt: serverTimestamp(),
        creatorId: auth.currentUser?.uid
      };
      
      if (exam.id) {
        await setDoc(doc(db, path, exam.id), examData);
        return exam.id;
      } else {
        const docRef = await addDoc(collection(db, path), examData);
        return docRef.id;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return '';
    }
  },

  async delete(id: string): Promise<void> {
    const path = `exams/${id}`;
    try {
      await deleteDoc(doc(db, 'exams', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  subscribeToUserExams(userId: string, callback: (exams: Exam[]) => void) {
    const path = 'exams';
    const q = query(collection(db, path), where('creatorId', '==', userId));
    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const exams = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toMillis() || Date.now()
          } as Exam;
        });
        callback(exams);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },

  subscribeToExams(callback: (exams: Exam[]) => void) {
    const path = 'exams';
    return onSnapshot(
      collection(db, path),
      (snapshot: QuerySnapshot<DocumentData>) => {
        const exams = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            // Convert Firestore Timestamp to number if needed for existing UI
            createdAt: data.createdAt?.toMillis() || Date.now()
          } as Exam;
        });
        callback(exams);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  }
};
