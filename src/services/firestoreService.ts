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
  QuerySnapshot,
  arrayUnion
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Exam, Course, Enrollment } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
  timestamp?: string;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorStr = String(error);
  
  // If user is not logged in or it's a permission error during logout/transition, log as warning
  if ((!auth.currentUser || !auth.currentUser.uid) && 
      (errorStr.includes('permissions') || errorStr.includes('permission-denied') || errorStr.includes('offline'))) {
    console.warn(`[Firestore] Permission denied or offline during transition: ${operationType} on ${path}`);
    return null;
  }

  // Also ignore permission denied on the 'users' path if we are just checking if it exists
  if (path?.startsWith('users/') && (errorStr.includes('permissions') || errorStr.includes('permission-denied'))) {
     console.warn(`[Firestore] Profile read denied (likely not created yet): ${path}`);
     return null;
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path,
    timestamp: new Date().toISOString()
  };
  
  console.error('[Firestore Error]', errInfo.error, {
    op: operationType,
    path,
    userId: errInfo.authInfo.userId
  });

  // We log clearly but don't throw to prevent complete app crashes
  // Callers should handle null/empty returns
  return errInfo;
}

export const examsService = {
  async getAll(): Promise<Exam[]> {
    const path = 'exams';
    if (!auth.currentUser) return [];
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
    if (!userId) {
      callback([]);
      return () => {};
    }
    const q = query(collection(db, path), where('creatorId', '==', userId));
    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
          const exams = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              createdAt: data.createdAt?.toMillis() || Date.now()
            } as Exam;
          });
          callback(exams);
        } catch (err) {
          console.error("Error processing exams snapshot:", err);
          callback([]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        callback([]);
      }
    );
  },

  subscribeToEnrolledExams(courseIds: string[], callback: (exams: Exam[]) => void) {
    const path = 'exams';
    if (!auth.currentUser) {
      console.warn("Attempted to subscribe to exams while not authenticated");
      callback([]);
      return () => {};
    }
    
    // Deduplicate and filter
    const uniqueIds = Array.from(new Set(courseIds)).filter(id => !!id);
    
    if (uniqueIds.length === 0) {
      callback([]);
      return () => {};
    }

    // Split into chunks of 10 for 'where in' limit
    const chunks = [];
    for (let i = 0; i < uniqueIds.length; i += 10) {
      chunks.push(uniqueIds.slice(i, i + 10));
    }

    const allExamsMap = new Map<number, Exam[]>();
    const unsubscribers = chunks.map((chunk, index) => {
      const q = query(collection(db, path), where('courseId', 'in', chunk));
      return onSnapshot(
        q,
        (snapshot) => {
          try {
            const chunkExams = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt?.toMillis() || Date.now()
              } as Exam;
            });
            
            allExamsMap.set(index, chunkExams);
            
            // Flatten all chunks
            const allExams: Exam[] = [];
            allExamsMap.forEach(exams => allExams.push(...exams));
            callback(allExams);
          } catch (err) {
            console.error("Error processing chunk exams snapshot:", err);
            callback([]);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, path);
          callback([]);
        }
      );
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  },

  subscribeToExams(callback: (exams: Exam[]) => void) {
    const path = 'exams';
    return onSnapshot(
      collection(db, path),
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
          const exams = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              createdAt: data.createdAt?.toMillis() || Date.now()
            } as Exam;
          });
          callback(exams);
        } catch (err) {
          console.error("Error processing exams snapshot:", err);
          callback([]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        callback([]);
      }
    );
  }
};

export const coursesService = {
  async create(name: string, description: string): Promise<string> {
    const path = 'courses';
    try {
      const id = crypto.randomUUID();
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const courseData = {
        id,
        name,
        description,
        code,
        creatorId: auth.currentUser?.uid,
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, path, id), courseData);
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return '';
    }
  },

  async delete(id: string): Promise<void> {
    const path = `courses/${id}`;
    console.log("Firestore delete called for:", path);
    try {
      await deleteDoc(doc(db, 'courses', id));
      console.log("Firestore deleteDoc finished for:", path);
    } catch (error) {
      console.error("Firestore delete error:", error);
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  subscribeToTeacherCourses(userId: string, callback: (courses: Course[]) => void) {
    const path = 'courses';
    if (!userId) {
      callback([]);
      return () => {};
    }
    const q = query(collection(db, path), where('creatorId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        try {
          callback(snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              createdAt: data.createdAt?.toMillis() || Date.now()
            } as Course;
          }));
        } catch (err) {
          console.error("Error processing teacher courses snapshot:", err);
          callback([]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        callback([]);
      }
    );
  },

  async enroll(code: string, studentName?: string): Promise<void> {
    const path = 'courses';
    const studentId = auth.currentUser?.uid;
    if (!studentId) throw new Error('No autenticado');

    // Find course by code
    const q = query(collection(db, path), where('code', '==', code));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) throw new Error('Código de curso inválido');
    
    const course = snapshot.docs[0].data() as Course;
    const courseId = snapshot.docs[0].id;

    // Create enrollment using composite ID
    const enrollmentId = `${studentId}_${courseId}`;
    await setDoc(doc(db, 'enrollments', enrollmentId), {
      id: enrollmentId,
      studentId,
      courseId,
      studentName: studentName || auth.currentUser?.displayName || auth.currentUser?.email,
      enrolledAt: serverTimestamp()
    });

    // Also update student profile for rule optimization
    await updateDoc(doc(db, 'users', studentId), {
      enrolledCourseIds: arrayUnion(courseId)
    });
  },

  subscribeToStudentEnrollments(studentId: string, callback: (courseIds: string[]) => void) {
    const path = 'enrollments';
    if (!studentId) {
      callback([]);
      return () => {};
    }
    const q = query(collection(db, path), where('studentId', '==', studentId));
    return onSnapshot(
      q,
      (snapshot) => {
        try {
          const ids = snapshot.docs
            .map(doc => doc.data().courseId)
            .filter(id => !!id && typeof id === 'string');
          callback(ids);
        } catch (err) {
          console.error("Error processing student enrollments snapshot:", err);
          callback([]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        callback([]);
      }
    );
  },

  async getCoursesByIds(ids: string[]): Promise<Course[]> {
    const validIds = ids.filter(id => !!id && typeof id === 'string');
    if (validIds.length === 0) return [];
    const path = 'courses';
    const courses: Course[] = [];
    
    try {
      const chunks = [];
      for (let i = 0; i < validIds.length; i += 10) {
        chunks.push(validIds.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        const q = query(collection(db, path), where('id', 'in', chunk));
        const res = await getDocs(q);
        res.docs.forEach(doc => {
          const data = doc.data();
          courses.push({
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toMillis() || Date.now()
          } as Course);
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
    
    return courses;
  },

  async getEnrollmentCount(courseId: string): Promise<number> {
    const path = 'enrollments';
    try {
      const q = query(collection(db, path), where('courseId', '==', courseId));
      const snap = await getDocs(q);
      return snap.size;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return 0;
    }
  },

  async getStudentsForCourse(courseId: string): Promise<Enrollment[]> {
    const path = 'enrollments';
    try {
      const q = query(collection(db, path), where('courseId', '==', courseId));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Enrollment));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  }
};

export const usersService = {
  async getAll(): Promise<any[]> {
    const path = 'users';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async updateProfile(uid: string, data: any): Promise<void> {
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
};
