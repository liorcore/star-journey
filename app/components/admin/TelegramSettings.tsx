'use client';

import { useState, useEffect } from 'react';
import { Settings, Check, X, ExternalLink, Copy, Send } from 'lucide-react';
import { getTelegramSettings, saveTelegramSettings, testTelegramConnection, TelegramSettings } from '@/app/lib/telegram';
import { useAuth } from '@/app/contexts/AuthContext';

export default function TelegramSettingsComponent() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<TelegramSettings | null>(null);
  const [chatId, setChatId] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user || !user.uid) {
      console.warn('User not available for loading settings - user:', user);
      // Don't try to load if user is not available
      return;
    }

    try {
      // Get ID token for authentication
      const idToken = await user.getIdToken();
      
      // Use API route instead of direct client-side call (bypasses Security Rules)
      const userId = encodeURIComponent(user.uid);
      const url = `/api/telegram/get-settings?userId=${userId}`;
      
      console.log('Loading Telegram settings for user:', user.uid);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.settings) {
        setSettings(result.settings);
        setChatId(result.settings.chatId || '');
      } else {
        console.warn('API returned unsuccessful result:', result);
        // Fallback to direct call if API fails
        try {
          const currentSettings = await getTelegramSettings();
          if (currentSettings) {
            setSettings(currentSettings);
            setChatId(currentSettings.chatId || '');
          }
        } catch (e) {
          console.error('Fallback also failed:', e);
        }
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      // Fallback to direct call on error
      try {
        const currentSettings = await getTelegramSettings();
        if (currentSettings) {
          setSettings(currentSettings);
          setChatId(currentSettings.chatId || '');
        }
      } catch (e) {
        // Ignore fallback errors
        console.error('Fallback also failed:', e);
      }
    }
  };

  const handleSaveChatId = async () => {
    if (!chatId.trim()) {
      alert('נא להזין Chat ID');
      return;
    }

    if (!user) {
      alert('עליך להתחבר כדי לשמור Chat ID');
      return;
    }

    setLoading(true);
    try {
      // Get ID token for authentication
      const idToken = await user.getIdToken();
      
      // Use API route instead of direct client-side call (bypasses Security Rules)
      const response = await fetch('/api/telegram/save-chat-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          chatId: chatId.trim(),
          userId: user.uid,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await loadSettings();
        alert('Chat ID נשמר בהצלחה');
      } else {
        alert(result.message || 'שגיאה בשמירת Chat ID');
      }
    } catch (error) {
      console.error('Error saving chat ID:', error);
      alert('שגיאה בשמירת Chat ID');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Call API route instead of direct function (server-side only)
      const response = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      setTestResult(result);
      await loadSettings();
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResult({ success: false, message: 'שגיאה בבדיקת החיבור' });
    } finally {
      setTesting(false);
    }
  };

  const getTelegramLink = () => {
    if (!settings?.botUsername) {
      return null;
    }
    const startParam = user?.uid || 'admin';
    return `https://t.me/${settings.botUsername}?start=${startParam}`;
  };

  const handleCopyLink = () => {
    const link = getTelegramLink();
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const telegramLink = getTelegramLink();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <Settings className="w-5 h-5 text-[#4D96FF]" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900">הגדרות התראות טלגרם</h3>
          <p className="text-xs text-slate-500">הגדר בוט טלגרם לקבלת התראות</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Bot Token Info */}
        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4">
          <div className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">
            טוקן בוט טלגרם
          </div>
          <div className="text-sm text-blue-900">
            הטוקן מוגדר במשתנה סביבה <code className="bg-blue-100 px-2 py-1 rounded text-xs">TELEGRAM_BOT_TOKEN</code>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            הטוקן נשמר בצורה מאובטחת במשתני סביבה ולא נחשף למשתמש
          </div>
        </div>

        {/* Status */}
        {settings && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className={`w-3 h-3 rounded-full ${settings.connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-black text-slate-900">
              {settings.connected ? 'מקושר' : 'לא מקושר'}
            </span>
            {settings.botUsername && (
              <span className="text-xs text-slate-500">@{settings.botUsername}</span>
            )}
          </div>
        )}

        {/* Telegram Link */}
        {telegramLink && (
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4">
            <div className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">
              קישור לחיבור בוט
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={telegramLink}
                readOnly
                className="flex-1 h-10 rounded-xl border-2 border-blue-200 bg-white px-4 text-sm font-mono text-slate-900"
                dir="ltr"
              />
              <button
                onClick={handleCopyLink}
                className="h-10 w-10 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 inline-flex items-center justify-center active:scale-95 transition-transform"
                title="העתק קישור"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-4 rounded-xl bg-blue-600 text-white font-black text-sm inline-flex items-center gap-2 active:scale-95 transition-transform"
              >
                פתח בטלגרם
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              לחץ על הקישור, שלח /start לבוט, והבוט ישלח לך את ה-Chat ID
            </p>
          </div>
        )}

        {/* Chat ID */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
          <div className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2">
            Chat ID (אופציונלי - ניתן להזין ידנית)
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="הזן Chat ID..."
              className="flex-1 h-10 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-mono text-slate-900 focus:outline-none focus:border-[#4D96FF]"
              dir="ltr"
            />
            <button
              onClick={handleSaveChatId}
              disabled={loading}
              className="h-10 px-4 rounded-xl bg-[#4D96FF] text-white font-black text-sm active:scale-95 transition-transform disabled:opacity-60"
            >
              {loading ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </div>

        {/* Test Connection */}
        <div className="space-y-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="w-full h-12 rounded-xl bg-[#4D96FF] text-white font-black active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {testing ? 'בודק...' : '📤 שלח הודעת בדיקה'}
          </button>
          <p className="text-xs text-slate-500 text-center">
            הכפתור ישלח הודעת בדיקה לטלגרם אם הטוקן ו-Chat ID מוגדרים
          </p>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`p-4 rounded-xl border-2 ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <X className="w-5 h-5 text-red-600" />
              )}
              <span className={`text-sm font-black ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                {testResult.message}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
