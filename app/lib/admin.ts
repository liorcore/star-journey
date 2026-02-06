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
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 getAdminDb(): Client-side, returning null');
    }
    return null; // Client-side - no Admin SDK
  }

  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 getAdminDb(): Importing firebase-admin...');
    }
    const admin = await import('firebase-admin');
    
    if (!admin.apps.length) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 getAdminDb(): No apps initialized, initializing...');
      }
      
      // Try service account JSON first (most reliable for Vercel)
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 getAdminDb(): Service account env var exists:', !!serviceAccount);
      }
      
      if (serviceAccount) {
        try {
          const serviceAccountJson = JSON.parse(serviceAccount);
          if (process.env.NODE_ENV !== 'production') {
            console.log('🔍 getAdminDb(): JSON parsed successfully');
            console.log('🔍 getAdminDb(): project_id:', serviceAccountJson.project_id);
          }
          
          if (!serviceAccountJson.project_id) {
            console.error('❌ getAdminDb(): project_id is missing from service account JSON!');
            throw new Error('project_id is missing from service account');
          }
          
          if (process.env.NODE_ENV !== 'production') {
            console.log('🔍 getAdminDb(): Initializing with service account...');
          }
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccountJson),
            projectId: serviceAccountJson.project_id,
          });
          if (process.env.NODE_ENV !== 'production') {
            console.log('✅ getAdminDb(): Service account initialization succeeded');
          }
        } catch (parseError: any) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('❌ getAdminDb(): JSON parsing failed:', parseError.message);
          }
          
          // If service account fails, try applicationDefault as fallback
          if (process.env.NODE_ENV !== 'production') {
            console.log('🔍 getAdminDb(): Trying applicationDefault() as fallback...');
          }
          try {
            let projectId: string | undefined;
            try {
              const serviceAccountJson = JSON.parse(serviceAccount);
              projectId = serviceAccountJson.project_id;
            } catch (e) {
              // Ignore parsing errors
            }
            
            if (projectId) {
              admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: projectId,
              });
              if (process.env.NODE_ENV !== 'production') {
                console.log('🔍 getAdminDb(): applicationDefault() succeeded with projectId:', projectId);
              }
            } else {
              admin.initializeApp({
                credential: admin.credential.applicationDefault(),
              });
              if (process.env.NODE_ENV !== 'production') {
                console.log('🔍 getAdminDb(): applicationDefault() succeeded (no explicit projectId)');
              }
            }
          } catch (e2) {
            if (process.env.NODE_ENV !== 'production') {
              console.error('❌ getAdminDb(): All initialization methods failed:', e2);
            }
            return null;
          }
        }
      } else {
        // No service account, try applicationDefault
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔍 getAdminDb(): No service account, trying applicationDefault()...');
        }
        try {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
          });
          if (process.env.NODE_ENV !== 'production') {
            console.log('🔍 getAdminDb(): applicationDefault() succeeded');
          }
        } catch (e) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('❌ getAdminDb(): applicationDefault() failed:', e);
          }
          return null;
        }
      }
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 getAdminDb(): Admin app already initialized');
      }
      // Check if the app has project ID
      const app = admin.apps[0];
      const currentProjectId = app?.options?.projectId;
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 getAdminDb(): Current app projectId:', currentProjectId);
      }
      
      if (!currentProjectId) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('⚠️ getAdminDb(): App initialized but no projectId!');
        }
        // Try to get project ID from service account
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (serviceAccount) {
          try {
            const serviceAccountJson = JSON.parse(serviceAccount);
            if (serviceAccountJson.project_id) {
              if (process.env.NODE_ENV !== 'production') {
                console.warn('⚠️ getAdminDb(): Reinitializing app with project ID...');
              }
              // Delete existing app and reinitialize
              try {
                admin.app().delete();
              } catch (deleteError) {
                // Ignore if delete fails
              }
              admin.initializeApp({
                credential: admin.credential.cert(serviceAccountJson),
                projectId: serviceAccountJson.project_id,
              });
              if (process.env.NODE_ENV !== 'production') {
                console.log('✅ getAdminDb(): Reinitialized with project ID:', serviceAccountJson.project_id);
              }
            }
          } catch (e) {
            console.error('❌ getAdminDb(): Failed to reinitialize:', e);
          }
        }
      }
    }
    
    // Get Firestore instance
    // Firestore should automatically use the project ID from the app
    // But if project ID is missing, we need to set it explicitly
    const app = admin.apps[0];
    const projectId = app?.options?.projectId;
    
    if (!projectId) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('❌ getAdminDb(): No project ID found in app options!');
      }
      // Try to get from service account
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (serviceAccount) {
        try {
          const serviceAccountJson = JSON.parse(serviceAccount);
          if (serviceAccountJson.project_id) {
            if (process.env.NODE_ENV !== 'production') {
              console.error('❌ getAdminDb(): App initialized without project ID, but service account has it!');
              console.error('❌ getAdminDb(): This means app was initialized elsewhere without project ID');
            }
            return null;
          }
        } catch (e) {
          // Ignore
        }
      }
      return null;
    }
    
    const firestore = admin.firestore();
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 getAdminDb(): Returning Firestore instance with projectId:', projectId);
    }
    return firestore;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ getAdminDb(): Error:', error);
    }
    return null;
  }
}

/**
 * Check if a user is an admin
 * Works both client-side (with client SDK) and server-side (with Admin SDK)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 isAdmin() called for userId:', userId);
    console.log('🔍 Environment:', typeof window !== 'undefined' ? 'client' : 'server');
  }
  
  if (!isFirebaseAvailable()) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Firebase not available, checking env var');
    }
    // Demo mode - check environment variable or return false
    const adminIds = process.env.ADMIN_USER_IDS?.split(',') || [];
    const result = adminIds.includes(userId);
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Env var check result:', result);
    }
    return result;
  }

  try {
    const isServerSide = typeof window === 'undefined';
    
    // Try to use Admin SDK first (server-side)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Attempting to get Admin SDK...');
    }
    const adminDb = await getAdminDb();
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Admin SDK result:', adminDb ? 'available' : 'not available');
    }
    
    if (adminDb) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 Using Admin SDK to check admin document...');
      }
      const adminDoc = await adminDb.collection('admins').doc(userId).get();
      const exists = adminDoc.exists;
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 Admin document exists:', exists);
      }
      return exists;
    }

    // On server-side, if Admin SDK is not available, we can't check admin status
    if (isServerSide) {
      console.error('❌ Admin SDK not available on server-side, cannot check admin status');
      return false;
    }

    // Fallback to client SDK (client-side only)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Falling back to client SDK (client-side)...');
    }
    if (!db) {
      console.error('❌ Client SDK not available');
      return false;
    }
    const adminRef = doc(db, 'admins', userId);
    const adminDoc = await getDoc(adminRef);
    const exists = adminDoc.exists();
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Client SDK check result:', exists);
    }
    return exists;
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
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
