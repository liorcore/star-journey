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
    console.log('🔍 getAdminDb(): Client-side, returning null');
    return null; // Client-side - no Admin SDK
  }

  try {
    console.log('🔍 getAdminDb(): Importing firebase-admin...');
    const admin = await import('firebase-admin');
    
    if (!admin.apps.length) {
      console.log('🔍 getAdminDb(): No apps initialized, initializing...');
      try {
        console.log('🔍 getAdminDb(): Trying applicationDefault()...');
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
        console.log('🔍 getAdminDb(): applicationDefault() succeeded');
      } catch (e) {
        console.warn('🔍 getAdminDb(): applicationDefault() failed:', e);
        try {
          const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
          console.log('🔍 getAdminDb(): Service account env var exists:', !!serviceAccount);
          if (serviceAccount) {
            const serviceAccountJson = JSON.parse(serviceAccount);
            console.log('🔍 getAdminDb(): Initializing with service account...');
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccountJson),
            });
            console.log('🔍 getAdminDb(): Service account initialization succeeded');
          } else {
            console.log('🔍 getAdminDb(): No service account, trying default init...');
            admin.initializeApp();
            console.log('🔍 getAdminDb(): Default init succeeded');
          }
        } catch (e2) {
          console.error('❌ getAdminDb(): All initialization methods failed:', e2);
          // Admin SDK not available
          return null;
        }
      }
    } else {
      console.log('🔍 getAdminDb(): Admin app already initialized');
    }
    
    const firestore = admin.firestore();
    console.log('🔍 getAdminDb(): Returning Firestore instance');
    return firestore;
  } catch (error) {
    console.error('❌ getAdminDb(): Error:', error);
    return null;
  }
}

/**
 * Check if a user is an admin
 * Works both client-side (with client SDK) and server-side (with Admin SDK)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  console.log('🔍 isAdmin() called for userId:', userId);
  console.log('🔍 Environment:', typeof window !== 'undefined' ? 'client' : 'server');
  
  if (!isFirebaseAvailable()) {
    console.log('🔍 Firebase not available, checking env var');
    // Demo mode - check environment variable or return false
    const adminIds = process.env.ADMIN_USER_IDS?.split(',') || [];
    const result = adminIds.includes(userId);
    console.log('🔍 Env var check result:', result);
    return result;
  }

  try {
    // Try to use Admin SDK first (server-side)
    console.log('🔍 Attempting to get Admin SDK...');
    const adminDb = await getAdminDb();
    console.log('🔍 Admin SDK result:', adminDb ? 'available' : 'not available');
    
    if (adminDb) {
      console.log('🔍 Using Admin SDK to check admin document...');
      const adminDoc = await adminDb.collection('admins').doc(userId).get();
      const exists = adminDoc.exists;
      console.log('🔍 Admin document exists:', exists);
      return exists;
    }

    // Fallback to client SDK (client-side or if Admin SDK not available)
    console.log('🔍 Falling back to client SDK...');
    const adminRef = doc(db!, 'admins', userId);
    const adminDoc = await getDoc(adminRef);
    const exists = adminDoc.exists();
    console.log('🔍 Client SDK check result:', exists);
    return exists;
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
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
