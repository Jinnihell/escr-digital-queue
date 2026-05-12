/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, DocumentSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider, actionCodeSettings } from '../firebase';
import type { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User | null>;
  loginWithGoogle: () => Promise<User | null>;
  signup: (email: string, password: string, username: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const cached = sessionStorage.getItem('user');
    if (cached) {
      try {
        return JSON.parse(cached) as User;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userObj = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              username: userData.username || '',
              role: userData.role || 'student',
              createdAt: userData.createdAt?.toDate() || new Date()
            };
            setUser(userObj);
            sessionStorage.setItem('user', JSON.stringify(userObj));
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      } else {
        setUser(null);
        sessionStorage.removeItem('user');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    setError(null);
    if (!email || !password) {
      setError('Email and password are required');
      throw new Error('Missing credentials');
    }
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      const userDoc = await Promise.race([
        getDoc(doc(db, 'users', result.user.uid)),
        new Promise<DocumentSnapshot>((_, reject) => 
          setTimeout(() => reject(new Error('User fetch timeout')), 5000)
        )
      ]) as DocumentSnapshot;

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (!userData) {
          throw new Error('Invalid user data');
        }
        const userObj: User = {
          id: result.user.uid,
          email: result.user.email || '',
          username: userData.username || '',
          role: userData.role || 'student',
          createdAt: userData.createdAt?.toDate() || new Date()
        };
        setUser(userObj);
        return userObj;
      }
      return null;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  };

  const loginWithGoogle = async (): Promise<User | null> => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          username: result.user.displayName || result.user.email?.split('@')[0] || 'User',
          email: result.user.email || '',
          role: 'student',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          photoURL: result.user.photoURL || null
        });
      }
      
      const updatedUserDoc = await getDoc(doc(db, 'users', result.user.uid));

      if (updatedUserDoc.exists()) {
        const userData = updatedUserDoc.data();
        if (!userData) {
          throw new Error('Invalid user data');
        }
        const userObj: User = {
          id: result.user.uid,
          email: result.user.email || '',
          username: userData.username || '',
          role: userData.role || 'student',
          createdAt: userData.createdAt?.toDate() || new Date()
        };
        setUser(userObj);
        return userObj;
      }
      return null;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google login failed';
      setError(message);
      throw err;
    }
  };

  const signup = async (email: string, password: string, username: string, role: UserRole) => {
    setError(null);
    
    if (!email || !password || !username) {
      setError('All fields are required');
      throw new Error('Missing fields');
    }
    
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email format');
      throw new Error('Invalid email');
    }
    
    const passwordRegex = /^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*])[A-Za-z\\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters with uppercase, number, and special character');
      throw new Error('Weak password');
    }
    
    const sanitizedUsername = username.replace(/<[^>]*>/g, '').trim();
    if (sanitizedUsername.length < 2 || sanitizedUsername.length > 50) {
      setError('Username must be between 2 and 50 characters');
      throw new Error('Invalid username');
    }
    
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        username: sanitizedUsername,
        email,
        role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      sessionStorage.removeItem('user');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Password reset failed';
      setError(message);
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ 
      user, 
      firebaseUser, 
      loading, 
      error, 
      login, 
      loginWithGoogle,
      signup, 
      logout, 
      resetPassword,
      clearError 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
