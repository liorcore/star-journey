import { NextRequest } from 'next/server';
import admin from 'firebase-admin';

/**
 * Get authenticated user ID from request
 * Verifies the Firebase ID token from Authorization header
 */
export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Try to get from cookie as fallback
      const token = request.cookies.get('firebase-token')?.value;
      if (!token) {
        return null;
      }
      return await verifyToken(token);
    }

    const token = authHeader.split('Bearer ')[1];
    return await verifyToken(token);
  } catch (error) {
    console.error('Error getting authenticated user ID:', error);
    return null;
  }
}

/**
 * Verify Firebase ID token and return user ID
 */
async function verifyToken(token: string): Promise<string | null> {
  try {
    // Initialize Admin SDK if needed
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      } catch (e) {
        try {
          const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
          if (serviceAccount) {
            try {
              const serviceAccountJson = JSON.parse(serviceAccount);
              
              if (!serviceAccountJson.project_id) {
                console.error('❌ auth-helper: project_id is missing from service account JSON!');
                throw new Error('project_id is missing from service account');
              }
              
              admin.initializeApp({
                credential: admin.credential.cert(serviceAccountJson),
                projectId: serviceAccountJson.project_id,
              });
              console.log('✅ auth-helper: Admin SDK initialized with service account');
            } catch (parseError: any) {
              console.error('❌ auth-helper: JSON parsing failed:', parseError.message);
              throw parseError;
            }
          } else {
            admin.initializeApp();
          }
        } catch (e2) {
          console.error('❌ auth-helper: Admin SDK initialization failed:', e2);
          return null;
        }
      }
    }

    // Verify token
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}
