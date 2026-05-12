/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true); // Start as true until auth state verified
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setFirebaseUser(firebaseUser);
        
        if (firebaseUser) {
          // Fetch user data from Firestore with timeout
          const userDoc = await Promise.race([
            getDoc(doc(db, 'users', firebaseUser.uid)),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('User fetch timeout')), 5000)
            )
          ]) as typeof userDoc;

          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Validate data exists before accessing
            if (userData) {
              const userObj: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                username: userData.username || '',
                role: userData.role || 'student',
                createdAt: userData.createdAt?.toDate() || new Date()
              };
              setUser(userObj);
            } else {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        // Don't expose sensitive errors - log securely
        const message = err instanceof Error ? err.message : 'Authentication error';
        console.error('Auth error:', message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    setError(null);
    // Validate inputs
    if (!email || !password) {
      setError('Email and password are required');
      throw new Error('Missing credentials');
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        
        // Fetch user data from Firestore with timeout
        const userDoc = await Promise.race([
          getDoc(doc(db, 'users', result.user.uid)),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('User fetch timeout')), 5000)
          )
        ]) as typeof userDoc;

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
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  };

  const loginWithGoogle = async (): Promise<User | null> => {
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const result = await signInWithPopup(auth, googleProvider);
        
        // Check if user document exists, if not create one (atomic operation preferred)
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (!userDoc.exists()) {
          // Create new user document for Google sign-in
          await setDoc(doc(db, 'users', result.user.uid), {
            username: result.user.displayName || result.user.email?.split('@')[0] || 'User',
            email: result.user.email || '',
            role: 'student', // Default role for Google sign-in
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            photoURL: result.user.photoURL || null
          });
        }
        
        // Fetch user data with timeout
        const updatedUserDoc = await Promise.race([
          getDoc(doc(db, 'users', result.user.uid)),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('User fetch timeout')), 5000)
          )
        ]) as typeof userDoc;

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
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google login failed';
      setError(message);
      throw err;
    }
  };

  const signup = async (email: string, password: string, username: string, role: UserRole) => {
    setError(null);
    
    // Validate inputs
    if (!email || !password || !username) {
      setError('All fields are required');
      throw new Error('Missing fields');
    }
    
    // Validate email format
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email format');
      throw new Error('Invalid email');
    }
    
    // Validate password strength (minimum 8 chars, 1 uppercase, 1 number, 1 special char)
    const passwordRegex = /^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*])[A-Za-z\\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters with uppercase, number, and special character');
      throw new Error('Weak password');
    }
    
    // Sanitize username
    const sanitizedUsername = username.replace(/<[^>]*>/g, '').trim();
    if (sanitizedUsername.length < 2 || sanitizedUsername.length > 50) {
      setError('Username must be between 2 and 50 characters');
      throw new Error('Invalid username');
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          username: sanitizedUsername,
          email,
          role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } finally {
        clearTimeout(timeoutId);
      }
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
      // User state will be cleared by onAuthStateChanged listener
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
