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
        // Try to get project ID from service account first
        const serviceAccountForProjectId = process.env.FIREBASE_SERVICE_ACCOUNT;
        let projectId: string | undefined;
        if (serviceAccountForProjectId) {
          try {
            const serviceAccountJson = JSON.parse(serviceAccountForProjectId);
            projectId = serviceAccountJson.project_id;
          } catch (e) {
            // Ignore parsing errors
          }
        }
        
        if (projectId) {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: projectId,
          });
          console.log('✅ auth-helper: Admin SDK initialized with applicationDefault and projectId:', projectId);
        } else {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
          });
          console.log('✅ auth-helper: Admin SDK initialized with applicationDefault (no explicit projectId)');
        }
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
            console.error('❌ auth-helper: No service account available!');
            // Don't initialize without project ID - it will fail
            throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is required');
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
