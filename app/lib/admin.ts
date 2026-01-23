import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Helper to check if Firebase is available
const isFirebaseAvailable = () => {
  if (!db) {
    return false;
  }
  return true;
};

/**
 * Check if a user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  if (!isFirebaseAvailable()) {
    // Demo mode - check environment variable or return false
    const adminIds = process.env.ADMIN_USER_IDS?.split(',') || [];
    return adminIds.includes(userId);
  }

  try {
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
