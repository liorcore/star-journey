'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { isAdmin } from '@/app/lib/admin';

interface AdminContextType {
  isAdmin: boolean;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [adminStatus, setAdminStatus] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAdminStatus(false);
      setLoading(false);
      return;
    }

    const checkAdminStatus = async () => {
      try {
        console.log('Checking admin status for user:', user.uid);
        const admin = await isAdmin(user.uid);
        console.log('Admin status result:', admin);
        setAdminStatus(admin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setAdminStatus(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const value = {
    isAdmin: adminStatus,
    loading,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
