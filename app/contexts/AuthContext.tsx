'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  UserCredential,
  fetchSignInMethodsForEmail,
  linkWithPopup,
} from 'firebase/auth';
import { auth, db } from '@/app/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  linkGoogleAccount: () => Promise<UserCredential>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for demo mode
const createMockUser = (email: string): Partial<User> => ({
  uid: 'demo-user-' + Date.now(),
  email,
  displayName: email.split('@')[0],
  emailVerified: true,
} as Partial<User>);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      // Demo mode - check localStorage for demo user
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        try {
          const userData = JSON.parse(demoUser);
          setUser(userData as User);
        } catch (e) {
          // Ignore
        }
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      
      // Update lastActive timestamp when user signs in
      if (user && db) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, {
            email: user.email,
            displayName: user.displayName || null,
            lastActive: serverTimestamp(),
          }, { merge: true }); // Use merge to avoid overwriting existing data
        } catch (error) {
          // Silently fail - don't block user sign in
          console.error('Error updating user document:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) {
      // Demo mode - create mock user
      const mockUser = createMockUser(email) as User;
      localStorage.setItem('demo_user', JSON.stringify(mockUser));
      setUser(mockUser as User);
      return { user: mockUser as User } as UserCredential;
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    if (!auth) {
      // Demo mode - create mock user
      const mockUser = createMockUser(email) as User;
      localStorage.setItem('demo_user', JSON.stringify(mockUser));
      setUser(mockUser as User);
      return { user: mockUser as User } as UserCredential;
    }
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document in Firestore
    if (db && result.user) {
      try {
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
          email: result.user.email,
          displayName: result.user.displayName || null,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
        }, { merge: true }); // Use merge to avoid overwriting existing data
      } catch (error) {
        // Silently fail - don't block user registration
        console.error('Error creating user document:', error);
      }
    }
    
    // Send Telegram notification for new user
    try {
      await fetch('/api/admin/notify-user-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          method: 'email',
        }),
      });
    } catch (error) {
      // Silently fail - don't block user registration
      console.error('Error sending signup notification:', error);
    }
    
    return result;
  };

  const signInWithGoogle = async () => {
    if (!auth) {
      // Demo mode - create mock user
      const mockUser = createMockUser('demo@example.com') as User;
      localStorage.setItem('demo_user', JSON.stringify(mockUser));
      setUser(mockUser as User);
      return { user: mockUser as User } as UserCredential;
    }
    
    const provider = new GoogleAuthProvider();
    
    try {
      // Try to sign in with Google
      const result = await signInWithPopup(auth, provider);
      
      // Check if this is a new user (first time sign in)
      // If user metadata shows creation time is very recent, it's a new user
      const isNewUser = result.user.metadata.creationTime && 
        new Date(result.user.metadata.creationTime).getTime() > Date.now() - 5000; // Within last 5 seconds
      
      if (isNewUser) {
        // Create user document in Firestore
        if (db && result.user) {
          try {
            const userRef = doc(db, 'users', result.user.uid);
            await setDoc(userRef, {
              email: result.user.email,
              displayName: result.user.displayName || null,
              createdAt: serverTimestamp(),
              lastActive: serverTimestamp(),
            }, { merge: true }); // Use merge to avoid overwriting existing data
          } catch (error) {
            // Silently fail - don't block user registration
            console.error('Error creating user document:', error);
          }
        }
        
        // Send Telegram notification for new user
        try {
          await fetch('/api/admin/notify-user-signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
              method: 'google',
            }),
          });
        } catch (error) {
          // Silently fail - don't block user registration
          console.error('Error sending signup notification:', error);
        }
      }
      
      return result;
    } catch (error: any) {
      // If account exists with different credential, try to link accounts
      if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.customData?.email || null;
        
        if (!email) {
          throw error;
        }
        
        // Check if user is already signed in
        if (auth.currentUser && auth.currentUser.email === email) {
          // User is signed in with the same email - link the Google credential
          try {
            return await linkWithPopup(auth.currentUser, provider);
          } catch (linkError: any) {
            // If linking fails, throw original error
            throw error;
          }
        }
        
        // User is not signed in - check what sign-in methods are available
        const signInMethods = await fetchSignInMethodsForEmail(auth, email);
        
        if (signInMethods.includes('password')) {
          // Account exists with email/password - user needs to sign in first
          throw new Error(
            'קיים כבר חשבון עם האימייל הזה. אנא התחבר קודם עם אימייל וסיסמה, ואז תוכל לקשר את חשבון Google.'
          );
        }
        
        // Re-throw original error if we can't handle it
        throw error;
      }
      
      // Re-throw other errors
      throw error;
    }
  };

  const linkGoogleAccount = async () => {
    if (!auth) {
      throw new Error('Firebase לא מוגדר');
    }
    
    if (!auth.currentUser) {
      throw new Error('עליך להתחבר קודם כדי לקשר חשבון Google');
    }
    
    const provider = new GoogleAuthProvider();
    return linkWithPopup(auth.currentUser, provider);
  };

  const resetPassword = async (email: string) => {
    if (!auth) {
      // Demo mode: Password reset not available
      return;
    }
    return sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    if (!auth) {
      // Demo mode - clear localStorage
      localStorage.removeItem('demo_user');
      setUser(null);
      return;
    }
    return signOut(auth);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    linkGoogleAccount,
    resetPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
