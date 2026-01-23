import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramNotification } from '@/app/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, displayName, method } = body;

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Send Telegram notification
    await sendTelegramNotification('user_signup', {
      userId,
      email,
      displayName: displayName || email.split('@')[0],
      method: method || 'unknown',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in notify-user-signup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
