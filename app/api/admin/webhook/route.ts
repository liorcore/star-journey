import { NextRequest, NextResponse } from 'next/server';
import { saveTelegramSettings, getTelegramSettings } from '@/app/lib/telegram';

/**
 * Webhook endpoint to receive Chat ID from Telegram bot
 * This should be called by the Telegram bot when user sends /start command
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId, userId } = body;

    if (!chatId) {
      return NextResponse.json({ error: 'Missing chatId' }, { status: 400 });
    }

    // Save chat ID to settings
    await saveTelegramSettings({
      chatId: String(chatId),
      connected: true,
    });

    return NextResponse.json({ success: true, message: 'Chat ID saved successfully' });
  } catch (error) {
    console.error('Error in webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET endpoint to retrieve current Telegram settings (for testing)
 */
export async function GET(request: NextRequest) {
  try {
    const settings = await getTelegramSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error getting settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
