import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  serverTimestamp,
  setDoc,
  orderBy,
  DocumentData,
  QuerySnapshot,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Exam, Course, Enrollment, ExamAttempt } from '../types';

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

  subscribeToExams(callback: (exams: Exam[]) => void, teacherId?: string) {
    const path = 'exams';
    let q = query(collection(db, path), orderBy('createdAt', 'desc'));
    
    if (teacherId) {
      q = query(collection(db, path), where('creatorId', '==', teacherId), orderBy('createdAt', 'desc'));
    }

    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
          const exams = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (typeof data.createdAt === 'number' ? data.createdAt : Date.now())
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
};

export const coursesService = {
  async create(name: string, description: string, creatorName?: string): Promise<string> {
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
        creatorName: creatorName || '',
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
      teacherId: course.creatorId,
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

      // Dynamically resolve creatorName from the user document if missing or default placeholder
      for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        if ((!course.creatorName || course.creatorName === 'Docente') && course.creatorId) {
          try {
            const userDoc = await usersService.getUser(course.creatorId);
            if (userDoc) {
              const creatorName = userDoc.fullName || userDoc.displayName || userDoc.email?.split('@')[0] || 'Docente Colectivo';
              course.creatorName = creatorName;
              
              // Silently try to update Firestore (will fail safely for students without update permission)
              updateDoc(doc(db, 'courses', course.id), {
                creatorName: creatorName
              }).catch(() => {
                // Ignore permission error if we are a student, we updated it locally
              });
            }
          } catch (e) {
            console.warn("Could not load or update creatorName for course on-the-fly:", course.id, e);
          }
        }
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
      const teacherId = auth.currentUser?.uid;
      let q = query(collection(db, path), where('courseId', '==', courseId));
      
      // If NOT admin, force teacherId check to match security rules
      // Note: We'd need to know if user is admin, but usually this is called by a teacher
      if (teacherId) {
        q = query(collection(db, path), where('courseId', '==', courseId), where('teacherId', '==', teacherId));
      }
      
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Enrollment));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  async updateCreatorName(courseId: string, name: string): Promise<void> {
    const path = `courses/${courseId}`;
    try {
      await updateDoc(doc(db, 'courses', courseId), {
        creatorName: name
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
};

export const usersService = {
  subscribeToAllUsers(callback: (users: any[]) => void) {
    const path = 'users';
    return onSnapshot(
      collection(db, path),
      (snap) => {
        callback(snap.docs.map(doc => ({ ...doc.data(), uid: doc.id })));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        callback([]);
      }
    );
  },

  async getUser(uid: string): Promise<any | null> {
    const path = `users/${uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const data = snap.data();
        return { ...data, uid: snap.id };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
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

export const chatService = {
  async sendMessage(conversationId: string, senderId: string, text: string): Promise<void> {
    const path = `conversations/${conversationId}/messages`;
    try {
      await addDoc(collection(db, path), {
        conversationId,
        senderId,
        userId: conversationId, // Required by blueprint
        text,
        createdAt: serverTimestamp(),
        read: false
      });

      // Recipient logic: if I'm the owner of the conversation, it's for admin. 
      // If I'm NOT the owner (I'm admin), it's for the owner.
      const recipientId = senderId === conversationId ? 'admin' : conversationId;

      // Use setDoc with merge: true to ensure the conversation document exists
      await setDoc(doc(db, 'conversations', conversationId), {
        id: conversationId,
        userId: conversationId, // Required by blueprint
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: senderId,
        participants: arrayUnion(senderId),
        unreadFor: arrayUnion(recipientId),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteConversation(conversationId: string): Promise<void> {
      const convRef = doc(db, 'conversations', conversationId);
      const messagesPath = `conversations/${conversationId}/messages`;
      const messagesCol = collection(db, messagesPath);

      try {
          // 1. Delete all messages
          const snapshot = await getDocs(messagesCol);
          for (const messageDoc of snapshot.docs) {
              await deleteDoc(messageDoc.ref);
          }
          // 2. Delete conversation
          await deleteDoc(convRef);
      } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `conversations/${conversationId}`);
      }
  },
  
  subscribeToConversation(conversationId: string, callback: (messages: any[]) => void) {
      const path = `conversations/${conversationId}/messages`;
      const q = query(collection(db, path), orderBy('createdAt', 'asc'));
      return onSnapshot(
        q, 
        (snapshot) => {
          callback(snapshot.docs.map(doc => ({...doc.data(), id: doc.id})));
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, path);
          callback([]);
        }
      );
  },

  subscribeToUserConversations(userId: string, isAdmin: boolean, callback: (conversations: any[]) => void) {
    const path = 'conversations';
    let q;
    if (isAdmin) {
      q = query(collection(db, path), orderBy('lastMessageAt', 'desc'));
    } else {
      // Filter by userId to match Firestore security rules requirements for non-admins
      q = query(collection(db, path), where('userId', '==', userId));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        callback(snapshot.docs.map(doc => ({...doc.data(), id: doc.id})));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        callback([]);
      }
    );
  },

  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    const path = `conversations/${conversationId}/messages/${messageId}`;
    try {
      await deleteDoc(doc(db, 'conversations', conversationId, 'messages', messageId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async markAsRead(conversationId: string): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const messagesPath = `conversations/${conversationId}/messages`;
      // 1. Mark individual messages as read (limit to 50 at a time to be safe)
      const q = query(
        collection(db, messagesPath), 
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(q);
      const unreadDocs = snapshot.docs.filter(d => d.data().senderId !== userId);
      
      if (unreadDocs.length > 0) {
        const promises = unreadDocs.map(messageDoc => 
          updateDoc(doc(db, messagesPath, messageDoc.id), { read: true })
        );
        await Promise.all(promises);
      }

      // 2. Remove me from unreadFor in the conversation record
      const roleInUnread = conversationId === userId ? userId : 'admin';
      const convRef = doc(db, 'conversations', conversationId);
      
      await updateDoc(convRef, {
        unreadFor: arrayRemove(roleInUnread)
      });
    } catch (error) {
      // Use a more specific error handler that doesn't spam as much
      const errorStr = String(error);
      if (!errorStr.includes('permission-denied') && !errorStr.includes('permissions')) {
        handleFirestoreError(error, OperationType.UPDATE, `conversations/${conversationId}`);
      } else {
        console.warn(`[Chat] markAsRead permission denied for ${conversationId} - this is normal if rules are still propagating`);
      }
    }
  }
};

export const examAttemptsService = {
    async createAttempt(attempt: Omit<ExamAttempt, 'id'>): Promise<string> {
        const path = 'exam_attempts';
        try {
            const data = {
                ...attempt,
                submittedAt: attempt.submittedAt || Date.now()
            };
            // Note: Validation rule requires examId, studentId, courseId, teacherId, answers, score, attemptNumber, status
            const docRef = await addDoc(collection(db, path), data);
            return docRef.id;
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, path);
            return '';
        }
    },
    subscribeToAttempts(examId: string, callback: (attempts: ExamAttempt[]) => void, filterBy: { studentId?: string, teacherId?: string } = {}) {
        const path = 'exam_attempts';
        let q = query(collection(db, path), where('examId', '==', examId));
        
        if (filterBy.studentId) {
            q = query(collection(db, path), where('examId', '==', examId), where('studentId', '==', filterBy.studentId));
        } else if (filterBy.teacherId) {
            q = query(collection(db, path), where('examId', '==', examId), where('teacherId', '==', filterBy.teacherId));
        }
        
        return onSnapshot(
            q,
            (snap) => {
                callback(snap.docs.map(doc => ({...doc.data(), id: doc.id} as ExamAttempt)));
            },
            (error) => {
                handleFirestoreError(error, OperationType.GET, path);
                callback([]);
            }
        );
    },
    async getAttemptsForExam(examId: string, filterBy: { studentId?: string, teacherId?: string } = {}): Promise<ExamAttempt[]> {
        const path = 'exam_attempts';
        try {
            let q = query(collection(db, path), where('examId', '==', examId));
            
            if (filterBy.studentId) {
                q = query(collection(db, path), where('examId', '==', examId), where('studentId', '==', filterBy.studentId));
            } else if (filterBy.teacherId) {
                q = query(collection(db, path), where('examId', '==', examId), where('teacherId', '==', filterBy.teacherId));
            }
            
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({...doc.data(), id: doc.id} as ExamAttempt));
        } catch (error) {
            handleFirestoreError(error, OperationType.GET, path);
            return [];
        }
    }
};

export const notificationsService = {
    async notify(userId: string, title: string, message: string, link: string): Promise<void> {
        const path = 'notifications';
        await addDoc(collection(db, path), {
            userId,
            title,
            message,
            link,
            read: false,
            createdAt: serverTimestamp()
        });
    }
};
