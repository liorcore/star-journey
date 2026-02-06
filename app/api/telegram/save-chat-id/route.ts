import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/app/lib/admin';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import admin from 'firebase-admin';
import { getAuthenticatedUserId } from '@/app/lib/auth-helper';

// Initialize Admin SDK if not already initialized
let adminDb: admin.firestore.Firestore | null = null;

try {
  if (typeof window === 'undefined') {
    // Server-side only
    if (!admin.apps.length) {
      // Try service account JSON first (most reliable for Vercel)
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      console.log('🔍 save-chat-id: Service account env var exists:', !!serviceAccount);
      
      if (serviceAccount) {
        try {
          const serviceAccountJson = JSON.parse(serviceAccount);
          console.log('🔍 save-chat-id: JSON parsed successfully');
          console.log('🔍 save-chat-id: project_id:', serviceAccountJson.project_id);
          
          if (!serviceAccountJson.project_id) {
            console.error('❌ save-chat-id: project_id is missing from service account JSON!');
            throw new Error('project_id is missing from service account');
          }
          
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccountJson),
            projectId: serviceAccountJson.project_id,
          });
          console.log('✅ save-chat-id: Admin SDK initialized with service account');
        } catch (parseError: any) {
          console.error('❌ save-chat-id: JSON parsing failed:', parseError.message);
          throw parseError;
        }
      } else {
        // Fallback to applicationDefault (for local development)
        console.log('🔍 save-chat-id: No service account, trying applicationDefault()...');
        try {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
          });
          console.log('✅ save-chat-id: Admin SDK initialized with applicationDefault');
        } catch (e) {
          console.error('❌ save-chat-id: Admin SDK initialization failed:', e);
        }
      }
    }
    
    adminDb = admin.firestore();
  }
} catch (error) {
  console.warn('Admin SDK not available, will use client SDK:', error);
}

/**
 * API route to save Chat ID (server-side only)
 * Uses Admin SDK to bypass Security Rules after verifying admin status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId } = body;
    
    // Try to get authenticated user ID from token first
    let userId: string | null = await getAuthenticatedUserId(request);
    
    // Fallback to body if token not available (for backward compatibility)
    if (!userId) {
      userId = body.userId;
    }

    const normalizedChatId = typeof chatId === 'string' ? chatId.trim() : String(chatId ?? '').trim();

    if (!normalizedChatId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Missing chatId or userId' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { success: false, message: 'Firebase לא מוגדר' },
        { status: 500 }
      );
    }

    // Check if user is admin (server-side check using client SDK)
    const userIsAdmin = await isAdmin(userId);
    
    if (!userIsAdmin) {
      return NextResponse.json(
        { success: false, message: 'רק אדמינים יכולים לשמור Chat ID. ודא שהוגדרת כאדמין ב-Firestore.' },
        { status: 403 }
      );
    }

    // Save chat ID to settings using Admin SDK (bypasses Security Rules)
    if (adminDb) {
      // Use Admin SDK - bypasses Security Rules
      await adminDb.collection('adminSettings').doc('telegram').set({
        chatId: normalizedChatId,
        connected: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } else {
      // Fallback to client SDK (will still need Security Rules)
      // This should work if the user is authenticated and is admin
      const { doc: docFn, setDoc, serverTimestamp } = await import('firebase/firestore');
      const settingsRef = docFn(db, 'adminSettings', 'telegram');
      await setDoc(settingsRef, {
        chatId: normalizedChatId,
        connected: true,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Chat ID נשמר בהצלחה' 
    });
  } catch (error: any) {
    console.error('Error saving chat ID:', error);
    
    // Check if it's a permissions error
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'שגיאת הרשאות: ודא שהוגדרת כאדמין ב-Firestore ב-collection `admins` עם ה-User ID שלך כ-Document ID. אם הבעיה נמשכת, נסה להשתמש ב-Admin SDK.' 
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: `שגיאה בשמירת Chat ID: ${error.message || 'שגיאה לא ידועה'}` 
      },
      { status: 500 }
    );
  }
}
