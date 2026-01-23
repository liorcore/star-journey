import { NextRequest, NextResponse } from 'next/server';
import { getTelegramSettings, testTelegramConnection } from '@/app/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const result = await testTelegramConnection();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in telegram test:', error);
    return NextResponse.json(
      { success: false, message: `שגיאה: ${error.message || 'שגיאה לא ידועה'}` },
      { status: 500 }
    );
  }
}
