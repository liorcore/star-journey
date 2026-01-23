import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Helper to check if Firebase is available
const isFirebaseAvailable = () => {
  if (!db) {
    return false;
  }
  return true;
};

export interface TelegramSettings {
  botToken: string;
  chatId?: string;
  connected: boolean;
  lastTest?: Date;
  botUsername?: string;
}

/**
 * Get Telegram settings from Firestore
 * Bot token is read from environment variable, not from Firestore
 */
export async function getTelegramSettings(): Promise<TelegramSettings | null> {
  if (!isFirebaseAvailable()) {
    return null;
  }

  try {
    // Get other settings from Firestore
    const settingsRef = doc(db!, 'adminSettings', 'telegram');
    const settingsDoc = await getDoc(settingsRef);
    
    const data = settingsDoc.exists() ? settingsDoc.data() : {};
    
    // Check if token exists (server-side only)
    // On client-side, we don't expose the token but assume it might exist
    const hasToken = typeof window === 'undefined' 
      ? !!process.env.TELEGRAM_BOT_TOKEN
      : true; // Assume it exists on client (we'll verify in API)
    
    return {
      botToken: hasToken ? 'configured' : '', // Don't expose actual token
      chatId: data.chatId || undefined,
      connected: data.connected || false,
      lastTest: data.lastTest?.toDate(),
      botUsername: data.botUsername || undefined,
    };
  } catch (error) {
    console.error('Error getting Telegram settings:', error);
    return null;
  }
}

/**
 * Save Telegram settings to Firestore
 * Note: botToken is not saved - it comes from environment variable
 */
export async function saveTelegramSettings(settings: Partial<Omit<TelegramSettings, 'botToken'>>): Promise<void> {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase לא מוגדר');
  }

  try {
    const settingsRef = doc(db!, 'adminSettings', 'telegram');
    await setDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving Telegram settings:', error);
    throw error;
  }
}

/**
 * Send a message to Telegram (server-side only)
 */
export async function sendTelegramMessage(message: string): Promise<boolean> {
  // This function should only be called server-side
  if (typeof window !== 'undefined') {
    console.warn('sendTelegramMessage should only be called server-side');
    return false;
  }

  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      console.warn('Telegram bot token not configured in environment variables');
      return false;
    }

    // Get chat ID from Firestore
    const settingsRef = doc(db!, 'adminSettings', 'telegram');
    const settingsDoc = await getDoc(settingsRef);
    
    if (!settingsDoc.exists()) {
      console.warn('Telegram settings not found in Firestore');
      return false;
    }

    const chatId = settingsDoc.data().chatId;
    
    if (!chatId) {
      console.warn('Telegram chat ID not configured');
      return false;
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Telegram API error:', error);
      return false;
    }

    // Update last test time
    await saveTelegramSettings({ lastTest: new Date() });
    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}

/**
 * Send notification based on type
 */
export async function sendTelegramNotification(
  type: 'user_signup' | 'user_error' | 'system_error',
  data: any
): Promise<void> {
  try {
    const settings = await getTelegramSettings();
    
    if (!settings || !settings.botToken || !settings.chatId || !settings.connected) {
      // Silently fail - don't throw errors if Telegram is not configured
      return;
    }

    let message = '';

    switch (type) {
      case 'user_signup':
        message = `🎉 <b>משתמש חדש נרשם!</b>\n\n` +
          `שם: ${data.displayName || data.email || 'לא זמין'}\n` +
          `אימייל: ${data.email || 'לא זמין'}\n` +
          `User ID: <code>${data.userId}</code>\n` +
          `שיטת רישום: ${data.method || 'לא זמין'}\n` +
          `תאריך: ${new Date().toLocaleString('he-IL')}`;
        break;

      case 'user_error':
        message = `⚠️ <b>שגיאה למשתמש</b>\n\n` +
          `משתמש: ${data.userEmail || 'לא זמין'} (<code>${data.userId}</code>)\n` +
          `סוג שגיאה: ${data.errorType || 'לא זמין'}\n` +
          `מיקום: ${data.location || 'לא זמין'}\n` +
          `הודעה: ${data.errorMessage || 'לא זמין'}\n` +
          `תאריך: ${new Date().toLocaleString('he-IL')}`;
        break;

      case 'system_error':
        message = `🚨 <b>שגיאה במערכת</b>\n\n` +
          `סוג: ${data.errorType || 'לא זמין'}\n` +
          `מיקום: ${data.location || 'לא זמין'}\n` +
          `הודעה: ${data.errorMessage || 'לא זמין'}\n` +
          `תאריך: ${new Date().toLocaleString('he-IL')}` +
          (data.stackTrace ? `\n\n<code>${data.stackTrace.substring(0, 500)}</code>` : '');
        break;
    }

    await sendTelegramMessage(message);
  } catch (error) {
    // Silently fail - don't throw errors for notification failures
    console.error('Error sending Telegram notification:', error);
  }
}

/**
 * Test Telegram connection
 */
export async function testTelegramConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const settings = await getTelegramSettings();
    
    if (!settings || !settings.botToken) {
      return { success: false, message: 'טוקן בוט לא מוגדר במשתני סביבה' };
    }

    // Test by getting bot info
    const response = await fetch(`https://api.telegram.org/bot${settings.botToken}/getMe`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, message: `טוקן בוט לא תקין: ${errorData.description || 'שגיאה לא ידועה'}` };
    }

    const botInfo = await response.json();
    
    if (!botInfo.ok) {
      return { success: false, message: 'טוקן בוט לא תקין' };
    }

    // Update bot username
    await saveTelegramSettings({ 
      botUsername: botInfo.result.username,
      connected: !!settings.chatId,
    });

    if (!settings.chatId) {
      return { success: false, message: 'Chat ID לא מוגדר - יש לקשר את הבוט' };
    }

    // Test by sending a message
    const testMessage = await sendTelegramMessage('✅ בדיקת חיבור - הכל תקין!');
    
    if (testMessage) {
      return { success: true, message: 'החיבור תקין! הודעה נשלחה בהצלחה.' };
    } else {
      return { success: false, message: 'שליחת הודעה נכשלה' };
    }
  } catch (error: any) {
    console.error('Error testing Telegram connection:', error);
    return { success: false, message: `שגיאה בבדיקת החיבור: ${error.message || 'שגיאה לא ידועה'}` };
  }
}
