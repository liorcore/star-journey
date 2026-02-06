import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { isAdmin } from '@/app/lib/admin';
import { getAuthenticatedUserId } from '@/app/lib/auth-helper';

// Initialize Admin SDK if not already initialized
let adminDb: admin.firestore.Firestore | null = null;

try {
  if (typeof window === 'undefined') {
    if (!admin.apps.length) {
      // Try service account JSON first (most reliable for Vercel)
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      console.log('🔍 telegram-test: Service account env var exists:', !!serviceAccount);

      if (serviceAccount) {
        try {
          const serviceAccountJson = JSON.parse(serviceAccount);
          console.log('🔍 telegram-test: JSON parsed successfully');
          console.log('🔍 telegram-test: project_id:', serviceAccountJson.project_id);

          if (!serviceAccountJson.project_id) {
            console.error('❌ telegram-test: project_id is missing from service account JSON!');
            throw new Error('project_id is missing from service account');
          }

          admin.initializeApp({
            credential: admin.credential.cert(serviceAccountJson),
            projectId: serviceAccountJson.project_id,
          });
          console.log('✅ telegram-test: Admin SDK initialized with service account');
        } catch (parseError: any) {
          console.error('❌ telegram-test: JSON parsing failed:', parseError.message);
          throw parseError;
        }
      } else {
        // Fallback to applicationDefault (for local development)
        console.log('🔍 telegram-test: No service account, trying applicationDefault()...');
        try {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
          });
          console.log('✅ telegram-test: Admin SDK initialized with applicationDefault');
        } catch (e) {
          console.error('❌ telegram-test: Admin SDK initialization failed:', e);
        }
      }
    }

    adminDb = admin.firestore();
  }
} catch (error) {
  console.warn('Admin SDK not available:', error);
}

export async function POST(request: NextRequest) {
  try {
    // Require authenticated admin (same as other telegram admin routes)
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'לא מזוהה' }, { status: 401 });
    }

    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return NextResponse.json({ success: false, message: 'אין הרשאות אדמין' }, { status: 403 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ success: false, message: 'טוקן בוט לא מוגדר במשתני סביבה' });
    }

    // Read Chat ID from Firestore (Admin SDK preferred)
    let chatId: string | undefined;
    let botUsername: string | undefined;

    if (adminDb) {
      const settingsDoc = await adminDb.collection('adminSettings').doc('telegram').get();
      if (settingsDoc.exists) {
        const data = settingsDoc.data() || {};
        chatId = data.chatId ? String(data.chatId) : undefined;
        botUsername = data.botUsername ? String(data.botUsername) : undefined;
      }
    } else {
      return NextResponse.json(
        { success: false, message: 'Admin SDK לא זמין בשרת - בדוק FIREBASE_SERVICE_ACCOUNT' },
        { status: 500 }
      );
    }

    // Validate token by getting bot info
    const meResp = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const meJson = await meResp.json().catch(() => null);
    if (!meResp.ok || !meJson?.ok) {
      const desc = meJson?.description ? String(meJson.description) : 'שגיאה לא ידועה';
      return NextResponse.json({ success: false, message: `טוקן בוט לא תקין: ${desc}` });
    }

    const usernameFromApi = meJson?.result?.username ? String(meJson.result.username) : undefined;

    // Persist bot username + lastTest
    await adminDb.collection('adminSettings').doc('telegram').set(
      {
        botUsername: usernameFromApi || botUsername,
        lastTest: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // If no Chat ID, succeed but explain
    if (!chatId || chatId.trim() === '') {
      return NextResponse.json({
        success: true,
        message: `הטוקן תקין! הבוט: @${usernameFromApi}. Chat ID לא מוגדר - יש לקשר את הבוט כדי לקבל התראות.`,
      });
    }

    // Send test message
    const sendResp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '✅ בדיקת חיבור - הכל תקין!',
        parse_mode: 'HTML',
      }),
    });

    const sendJson = await sendResp.json().catch(() => null);
    if (!sendResp.ok || !sendJson?.ok) {
      const desc = sendJson?.description ? String(sendJson.description) : 'שגיאה לא ידועה';
      return NextResponse.json({ success: false, message: `שליחת הודעה נכשלה: ${desc}` });
    }

    // Mark as connected
    await adminDb.collection('adminSettings').doc('telegram').set(
      {
        chatId: chatId,
        connected: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, message: 'החיבור תקין! הודעה נשלחה בהצלחה.' });
  } catch (error: any) {
    console.error('Error in telegram test:', error);
    return NextResponse.json(
      { success: false, message: `שגיאה: ${error.message || 'שגיאה לא ידועה'}` },
      { status: 500 }
    );
  }
}
