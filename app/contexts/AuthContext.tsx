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
} from 'firebase/auth';
import { auth } from '@/app/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
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

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
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
    return createUserWithEmailAndPassword(auth, email, password);
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
    return signInWithPopup(auth, provider);
  };

  const resetPassword = async (email: string) => {
    if (!auth) {
      console.warn('Demo mode: Password reset not available');
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
