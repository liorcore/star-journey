import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Helper to check if Firebase is available
const isFirebaseAvailable = () => {
  if (!db) {
    return false;
  }
  return true;
};

// Helper to get Admin SDK (server-side only)
async function getAdminDb() {
  if (typeof window !== 'undefined') {
    return null; // Client-side - no Admin SDK
  }

  try {
    const admin = await import('firebase-admin');
    
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      } catch (e) {
        try {
          const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
          if (serviceAccount) {
            const serviceAccountJson = JSON.parse(serviceAccount);
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccountJson),
            });
          } else {
            admin.initializeApp();
          }
        } catch (e2) {
          // Admin SDK not available
          return null;
        }
      }
    }
    
    return admin.firestore();
  } catch (error) {
    return null;
  }
}

/**
 * Check if a user is an admin
 * Works both client-side (with client SDK) and server-side (with Admin SDK)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  if (!isFirebaseAvailable()) {
    // Demo mode - check environment variable or return false
    const adminIds = process.env.ADMIN_USER_IDS?.split(',') || [];
    return adminIds.includes(userId);
  }

  try {
    // Try to use Admin SDK first (server-side)
    const adminDb = await getAdminDb();
    if (adminDb) {
      const adminDoc = await adminDb.collection('admins').doc(userId).get();
      return adminDoc.exists;
    }

    // Fallback to client SDK (client-side or if Admin SDK not available)
    const adminRef = doc(db!, 'admins', userId);
    const adminDoc = await getDoc(adminRef);
    return adminDoc.exists();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Add a user as admin (only for existing admins or server-side)
 */
export async function addAdmin(userId: string): Promise<void> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase לא מוגדר');
  }

  try {
    const adminRef = doc(db!, 'admins', userId);
    await setDoc(adminRef, {
      userId,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding admin:', error);
    throw error;
  }
}

/**
 * Remove admin status from a user
 */
export async function removeAdmin(userId: string): Promise<void> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase לא מוגדר');
  }

  try {
    const adminRef = doc(db!, 'admins', userId);
    await deleteDoc(adminRef);
  } catch (error) {
    console.error('Error removing admin:', error);
    throw error;
  }
}
