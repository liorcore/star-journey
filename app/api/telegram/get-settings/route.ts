import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/app/lib/admin';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import admin from 'firebase-admin';

// Initialize Admin SDK if not already initialized
let adminDb: admin.firestore.Firestore | null = null;

try {
  if (typeof window === 'undefined') {
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
          console.warn('Admin SDK initialization failed:', e2);
        }
      }
    }
    adminDb = admin.firestore();
  }
} catch (error) {
  console.warn('Admin SDK not available:', error);
}

/**
 * API route to get Telegram settings (server-side only)
 * Uses Admin SDK to bypass Security Rules after verifying admin status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Missing userId' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { success: false, message: 'Firebase לא מוגדר' },
        { status: 500 }
      );
    }

    // Check if user is admin (server-side check)
    const userIsAdmin = await isAdmin(userId);
    
    if (!userIsAdmin) {
      return NextResponse.json(
        { success: false, message: 'רק אדמינים יכולים לראות הגדרות טלגרם' },
        { status: 403 }
      );
    }

    // Get settings using Admin SDK (bypasses Security Rules)
    let settingsData: any = {};
    
    if (adminDb) {
      // Use Admin SDK
      const settingsDoc = await adminDb.collection('adminSettings').doc('telegram').get();
      if (settingsDoc.exists) {
        const data = settingsDoc.data();
        if (data) {
          settingsData = data;
          // Convert Admin SDK Timestamp to Date
          if (settingsData.lastTest && settingsData.lastTest.toDate) {
            settingsData.lastTest = settingsData.lastTest.toDate();
          } else if (settingsData.lastTest && settingsData.lastTest.seconds) {
            settingsData.lastTest = new Date(settingsData.lastTest.seconds * 1000);
          }
        }
      }
    } else {
      // Fallback to client SDK
      const settingsRef = doc(db, 'adminSettings', 'telegram');
      const settingsDoc = await getDoc(settingsRef);
      if (settingsDoc.exists()) {
        settingsData = settingsDoc.data();
        if (settingsData.lastTest && settingsData.lastTest.toDate) {
          settingsData.lastTest = settingsData.lastTest.toDate();
        }
      }
    }

    // Check if token exists (server-side only)
    const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;

    return NextResponse.json({
      success: true,
      settings: {
        botToken: hasToken ? 'configured' : '',
        chatId: settingsData.chatId || undefined,
        connected: settingsData.connected || false,
        lastTest: settingsData.lastTest || undefined,
        botUsername: settingsData.botUsername || undefined,
      },
    });
  } catch (error: any) {
    console.error('Error getting Telegram settings:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `שגיאה בטעינת הגדרות: ${error.message || 'שגיאה לא ידועה'}` 
      },
      { status: 500 }
    );
  }
}
