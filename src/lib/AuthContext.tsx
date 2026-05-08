import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { handleFirestoreError, OperationType } from '../services/firestoreService';

import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  requestDocente: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        if (user) {
          const docRef = doc(db, 'users', user.uid);
          let docSnap;
          try {
            docSnap = await getDoc(docRef);
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
            // If getDoc fails here, we might have a permission issue or a new user.
            // We'll proceed to try creating the profile if appropriate.
          }
          
          if (docSnap && docSnap.exists()) {
            const data = docSnap.data();
            const updates: any = {};
            let hasUpdates = false;

            // Auto-upgrade bootstrap admin
            if (user.email === 'florezarturo1816@gmail.com' && data.role !== 'admin') {
              updates.role = 'admin';
              hasUpdates = true;
            }

            // Ensure enrolledCourseIds exists and is in sync with enrollments
            const profileEnrolledIds = data.enrolledCourseIds || [];
            
            try {
              // Backfill: Check the enrollments collection as the source of truth
              const enrollRef = collection(db, 'enrollments');
              const q = query(enrollRef, where('studentId', '==', user.uid));
              const enrollSnap = await getDocs(q);
              const actualEnrolledIds = enrollSnap.docs.map(d => d.data().courseId);
              
              // Check if any ID from enrollments is missing in profile
              const missingIds = actualEnrolledIds.filter(id => !profileEnrolledIds.includes(id));
              
              if (!data.enrolledCourseIds || missingIds.length > 0) {
                const combinedIds = Array.from(new Set([...profileEnrolledIds, ...actualEnrolledIds]));
                updates.enrolledCourseIds = combinedIds;
                hasUpdates = true;
              }
            } catch (err) {
              // Only log but don't disrupt if enrollment sync fails
              handleFirestoreError(err, OperationType.GET, 'enrollments');
            }

            if (hasUpdates) {
              try {
                await setDoc(docRef, updates, { merge: true });
                setProfile({ ...data, ...updates });
              } catch (err) {
                handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
                setProfile(data);
              }
            } else {
              setProfile(data);
            }
          } else {
            // Initialize profile for new users or if getDoc failed but we want to try creating it
            try {
              const newProfile: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                role: user.email === 'florezarturo1816@gmail.com' ? 'admin' : 'student',
                roleRequest: 'none',
                enrolledCourseIds: [],
                createdAt: serverTimestamp()
              };
              await setDoc(docRef, newProfile);
              setProfile(newProfile);
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
              // Fallback profile if create fails
              const fallbackProfile: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                role: 'student',
                roleRequest: 'none',
                enrolledCourseIds: [],
                createdAt: serverTimestamp()
              };
              setProfile(fallbackProfile);
            }
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Critical Auth Sync Error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const register = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const requestDocente = async () => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    await setDoc(docRef, { 
      roleRequest: 'pending',
      updatedAt: serverTimestamp() 
    }, { merge: true });
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    const updateData = { ...data, updatedAt: serverTimestamp() };
    await setDoc(docRef, updateData, { merge: true });
    if (profile) {
      setProfile({ ...profile, ...data });
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, requestDocente, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
