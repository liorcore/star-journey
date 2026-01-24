'use client';

import { useState } from 'react';
import { Check, Eye, EyeOff, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
  onPasswordChange: (password: string) => void;
  showValidation?: boolean;
  autocompleteType?: 'current-password' | 'new-password';
  name?: string;
  id?: string;
}

export default function PasswordStrength({
  password,
  onPasswordChange,
  showValidation = true,
  autocompleteType = 'current-password',
  name = 'password',
  id,
}: PasswordStrengthProps) {
  const [showPassword, setShowPassword] = useState(false);

  const hasMinLength = password.length >= 6;
  const hasLetter = /[A-Za-z\u0590-\u05FF]/.test(password);
  const hasNumber = /\d/.test(password);

  const getStrength = () => {
    if (password.length === 0) return { level: 0, text: '', color: '' };
    if (password.length < 6) return { level: 1, text: 'חלש', color: 'text-red-500' };
    if (!hasLetter || !hasNumber) return { level: 2, text: 'בינוני', color: 'text-orange-500' };
    return { level: 3, text: 'חזק', color: 'text-green-500' };
  };

  const strength = getStrength();
  const meterColor =
    strength.level >= 3 ? 'bg-green-500' : strength.level >= 2 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          id={id}
          name={name}
          autoComplete={autocompleteType}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="סיסמה"
          className="w-full h-11 rounded-2xl border-2 border-slate-200 bg-white px-4 pr-12 text-sm font-black text-slate-900 focus:outline-none focus:border-[#4D96FF] text-right"
          dir="ltr"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 active:scale-95 transition-transform"
          aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      {showValidation && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
              חוזק סיסמה
            </span>
            <span className={`text-xs font-black ${strength.color}`}>{strength.text || '—'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`h-1.5 flex-1 rounded-full ${strength.level >= n ? meterColor : 'bg-slate-200'}`}
              />
            ))}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              {hasMinLength ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
              <span className={hasMinLength ? 'text-green-600' : 'text-slate-500'}>מינימום 6 תווים</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {hasLetter ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
              <span className={hasLetter ? 'text-green-600' : 'text-slate-500'}>לפחות אות אחת</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {hasNumber ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
              <span className={hasNumber ? 'text-green-600' : 'text-slate-500'}>לפחות ספרה אחת</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
