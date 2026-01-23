# סקריפטים שימושיים

## get-env-values.js

סקריפט להוצאת ערכי משתני הסביבה של Firebase.

### שימוש:

```bash
npm run get-env-values
```

או:

```bash
node scripts/get-env-values.js
```

### מה הסקריפט עושה:

1. **קורא את קובץ `.env.local`** (אם קיים)
2. **מציג את כל ערכי משתני הסביבה** של Firebase
3. **מציג פורמט מוכן להעתקה** ל-Vercel Dashboard

### דרישות:

- קובץ `.env.local` עם משתני הסביבה של Firebase
- Node.js מותקן

### דוגמה לפלט:

```
📋 ערכי משתני הסביבה של Firebase:
════════════════════════════════════════════════════════════

1. NEXT_PUBLIC_FIREBASE_API_KEY:
   AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456

2. NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
   my-project.firebaseapp.com

...

📦 פורמט להעתקה ל-Vercel:
════════════════════════════════════════════════════════════

Key: NEXT_PUBLIC_FIREBASE_API_KEY
Value: AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456
Environments: ✅ Production, ✅ Preview, ✅ Development
```

### אם הקובץ לא קיים:

הסקריפט יציג הוראות מפורטות איך ליצור את הקובץ ולמצוא את הערכים ב-Firebase Console.
