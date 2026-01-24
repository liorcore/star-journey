'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Rocket, Mail, Lock, ArrowRight, ArrowLeft, X, Eye, EyeOff, Check, Minus } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import PasswordStrength from '@/app/components/PasswordStrength';
import { checkRateLimit, resetRateLimit } from '@/app/lib/rateLimiting';
import { sanitizeAndValidate, validateEmail } from '@/app/lib/dataProtection';

type View = 'login' | 'signup' | 'forgot';

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/');
    } catch (err: any) {
      // Log error for debugging
      console.error('Login error:', err);
      console.error('Error code:', err?.code);
      console.error('Error message:', err?.message);
      console.error('Full error object:', JSON.stringify(err, null, 2));
      
      // Try to get error code from different possible locations
      const errorCode = err?.code || err?.error?.code || err?.errorCode || null;
      setError(getErrorMessage(errorCode));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Validate email
      if (!validateEmail(email)) {
        setError('כתובת אימייל לא תקינה');
        return;
      }

      // Sanitize email
      const sanitizedEmail = sanitizeAndValidate(email, { maxLength: 100 });

      if (password !== confirmPassword) {
        setError('הסיסמאות אינן תואמות');
        return;
      }

      if (password.length < 6) {
        setError('הסיסמה חייבת להכיל לפחות 6 תווים');
        return;
      }

      setLoading(true);

      await signUp(sanitizedEmail, password);
      router.push('/');
    } catch (err: any) {
      // Log error for debugging
      console.error('Signup error:', err);
      console.error('Error code:', err?.code);
      const errorCode = err?.code || err?.error?.code || err?.errorCode || null;
      setError(getErrorMessage(errorCode));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      router.push('/');
    } catch (err: any) {
      // Check if error has a custom message (for account linking)
      if (err.message && typeof err.message === 'string' && err.message.includes('קיים כבר חשבון')) {
        setError(err.message);
      } else {
        // Log error for debugging
        console.error('Google sign in error:', err);
        console.error('Error code:', err?.code);
        const errorCode = err?.code || err?.error?.code || err?.errorCode || null;
        setError(getErrorMessage(errorCode));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setError('נשלח אימייל לאיפוס סיסמה');
      setTimeout(() => {
        setView('login');
        setError('');
      }, 3000);
    } catch (err: any) {
      // Log error for debugging
      console.error('Reset password error:', err);
      console.error('Error code:', err?.code);
      const errorCode = err?.code || err?.error?.code || err?.errorCode || null;
      setError(getErrorMessage(errorCode));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (code: string | undefined | null): string => {
    if (!code) {
      return 'שגיאה בהתחברות. נסה שוב';
    }
    
    // Normalize error code (remove spaces, convert to lowercase for comparison)
    const normalizedCode = code.toLowerCase().trim();
    
    switch (normalizedCode) {
      case 'auth/user-not-found':
        return 'משתמש לא נמצא';
      case 'auth/wrong-password':
        return 'סיסמה שגויה';
      case 'auth/email-already-in-use':
        return 'כתובת אימייל כבר בשימוש';
      case 'auth/weak-password':
        return 'הסיסמה חלשה מדי';
      case 'auth/invalid-email':
        return 'כתובת אימייל לא תקינה';
      case 'auth/too-many-requests':
        return 'יותר מדי ניסיונות. נסה שוב מאוחר יותר';
      case 'auth/account-exists-with-different-credential':
        return 'קיים כבר חשבון עם האימייל הזה. אנא התחבר קודם עם אימייל וסיסמה, ואז תוכל לקשר את חשבון Google.';
      case 'auth/invalid-credential':
      case 'auth/invalid-login-credentials':
      case 'invalid-credential':
      case 'invalid-login-credentials':
        // For invalid credentials, provide a more helpful message
        return 'אימייל או סיסמה שגויים. אנא בדוק את הפרטים ונסה שוב';
      default:
        // Log unknown error codes for debugging
        console.warn('Unknown error code:', code);
        return 'שגיאה בהתחברות. נסה שוב';
    }
  };

  const passwordHasMinLength = password.length >= 6;
  const passwordHasLetter = /[A-Za-z\u0590-\u05FF]/.test(password);
  const passwordHasNumber = /\d/.test(password);
  const passwordStrength = (() => {
    if (password.length === 0) return { level: 0, text: '—', color: 'text-slate-500' };
    if (password.length < 6) return { level: 1, text: 'חלש', color: 'text-red-500' };
    if (!passwordHasLetter || !passwordHasNumber) return { level: 2, text: 'בינוני', color: 'text-orange-500' };
    return { level: 3, text: 'חזק', color: 'text-green-500' };
  })();
  const meterColor =
    passwordStrength.level >= 3 ? 'bg-green-500' : passwordStrength.level >= 2 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-10" dir="rtl">
      <main className="max-w-md mx-auto px-3 pt-10 sm:pt-16">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-[2.5rem] bg-white border border-slate-200 shadow-sm mb-4">
            <Rocket className="w-7 h-7 text-[#4D96FF]" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black rainbow-text leading-tight">
            מסע בין כוכבים
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-3">
            התחבר או הירשם כדי להתחיל
          </p>
        </motion.section>

        {/* Forms */}
        <AnimatePresence mode="wait">
          {view === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
            >
              <h2 className="text-2xl font-black text-slate-900 mb-6">התחברות</h2>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2">
                    אימייל
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      id="login-email"
                      name="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      placeholder="your@email.com"
                      className="w-full h-11 rounded-2xl border-2 border-slate-200 bg-slate-50 px-10 text-sm font-black text-slate-900 focus:outline-none focus:border-[#4D96FF] text-right"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2">
                    סיסמה
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <PasswordStrength
                      password={password}
                      onPasswordChange={(pwd) => {
                        setPassword(pwd);
                        setError('');
                      }}
                      showValidation={false}
                      autocompleteType="current-password"
                      name="password"
                      id="login-password"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setView('forgot')}
                  className="text-xs font-black text-[#4D96FF] hover:underline"
                >
                  שכחתי סיסמה
                </button>

                {error && <p className="text-red-600 text-sm font-black text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-star h-12 rounded-2xl w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:active:scale-100"
                >
                  {loading ? 'מתחבר...' : 'התחבר'}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-slate-500 font-black">או</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="h-12 rounded-2xl w-full border-2 border-slate-200 bg-white font-black text-slate-800 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                התחבר עם Google
              </button>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setView('signup')}
                  className="text-sm font-black text-slate-600 hover:text-[#4D96FF] transition-colors"
                >
                  אין לך חשבון? הירשם
                  <ArrowLeft className="inline w-4 h-4 mr-1" />
                </button>
              </div>
            </motion.div>
          )}

          {view === 'signup' && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
            >
              <h2 className="text-2xl font-black text-slate-900 mb-6">הרשמה</h2>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2">
                    אימייל
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      id="signup-email"
                      name="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      placeholder="your@email.com"
                      className="w-full h-11 rounded-2xl border-2 border-slate-200 bg-slate-50 px-10 text-sm font-black text-slate-900 focus:outline-none focus:border-[#4D96FF] text-right"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2">
                    סיסמה
                  </label>
                  <PasswordStrength
                    password={password}
                    onPasswordChange={(pwd) => {
                      setPassword(pwd);
                      setError('');
                    }}
                    showValidation={false}
                    autocompleteType="new-password"
                    name="password"
                    id="signup-password"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2">
                    אימות סיסמה
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="signup-confirm-password"
                      name="confirmPassword"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="אימות סיסמה"
                      className="w-full h-11 rounded-2xl border-2 border-slate-200 bg-slate-50 px-10 pr-12 text-sm font-black text-slate-900 focus:outline-none focus:border-[#4D96FF] text-right"
                      dir="ltr"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 active:scale-95 transition-transform"
                      aria-label={showConfirmPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Password guidelines + strength meter (under confirm password) */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      חוזק סיסמה
                    </span>
                    <span className={`text-xs font-black ${passwordStrength.color}`}>{passwordStrength.text}</span>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className={`h-1.5 flex-1 rounded-full ${passwordStrength.level >= n ? meterColor : 'bg-slate-200'}`}
                      />
                    ))}
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      {passwordHasMinLength ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Minus className="w-3 h-3 text-slate-400" />
                      )}
                      <span className={passwordHasMinLength ? 'text-green-600' : 'text-slate-500'}>
                        מינימום 6 תווים
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordHasLetter ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Minus className="w-3 h-3 text-slate-400" />
                      )}
                      <span className={passwordHasLetter ? 'text-green-600' : 'text-slate-500'}>
                        לפחות אות אחת
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordHasNumber ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Minus className="w-3 h-3 text-slate-400" />
                      )}
                      <span className={passwordHasNumber ? 'text-green-600' : 'text-slate-500'}>
                        לפחות ספרה אחת
                      </span>
                    </div>
                  </div>
                </div>

                {error && <p className="text-red-600 text-sm font-black text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-star h-12 rounded-2xl w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:active:scale-100"
                >
                  {loading ? 'נרשם...' : 'הירשם'}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-slate-500 font-black">או</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="h-12 rounded-2xl w-full border-2 border-slate-200 bg-white font-black text-slate-800 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                הירשם עם Google
              </button>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setView('login')}
                  className="text-sm font-black text-slate-600 hover:text-[#4D96FF] transition-colors"
                >
                  יש לך חשבון? התחבר
                  <ArrowRight className="inline w-4 h-4 mr-1" />
                </button>
              </div>
            </motion.div>
          )}

          {view === 'forgot' && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
            >
              <h2 className="text-2xl font-black text-slate-900 mb-6">שכחתי סיסמה</h2>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2">
                    אימייל
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      id="forgot-email"
                      name="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      placeholder="your@email.com"
                      className="w-full h-11 rounded-2xl border-2 border-slate-200 bg-slate-50 px-10 text-sm font-black text-slate-900 focus:outline-none focus:border-[#4D96FF] text-right"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p
                    className={`text-sm font-black text-center ${
                      error.includes('נשלח') ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-star h-12 rounded-2xl w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:active:scale-100"
                >
                  {loading ? 'שולח...' : 'שלח אימייל איפוס'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setView('login')}
                  className="text-sm font-black text-slate-600 hover:text-[#4D96FF] transition-colors"
                >
                  חזרה להתחברות
                  <ArrowRight className="inline w-4 h-4 mr-1" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
