# ✅ Checklist לפריסה ב-Vercel

## לפני הפריסה

- [ ] Firebase project נוצר ומוגדר
- [ ] Email/Password Authentication מופעל ב-Firebase
- [ ] Google Sign-In מופעל ב-Firebase (אם נדרש)
- [ ] Firestore Database נוצר
- [ ] Security Rules מוגדרים ב-Firestore (ראה `firestore.rules`)
- [ ] כל הפרטים מ-Firebase Console מוכנים

## במהלך הפריסה

### 1. Vercel Setup
- [ ] חשבון Vercel נוצר
- [ ] Repository מחובר ל-Vercel
- [ ] Project נוצר ב-Vercel Dashboard

### 2. Environment Variables
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` הוגדר
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` הוגדר
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` הוגדר
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` הוגדר
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` הוגדר
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID` הוגדר
- [ ] כל המשתנים מסומנים עבור Production, Preview, Development

### 3. Firebase Configuration
- [ ] Authorized domains כולל את ה-URL של Vercel
- [ ] Firestore Security Rules פורסמו
- [ ] Google OAuth Client ID מוגדר (אם נדרש)

## אחרי הפריסה

- [ ] האפליקציה נטענת ב-URL של Vercel
- [ ] התחברות עם Email/Password עובדת
- [ ] התחברות עם Google עובדת (אם מופעל)
- [ ] יצירת קבוצה עובדת
- [ ] יצירת אירוע עובדת
- [ ] הוספת משתתפים עובדת
- [ ] ניהול כוכבים עובד

## בדיקות אבטחה

- [ ] `.env.local` לא נשמר ב-Git (בדוק ב-.gitignore)
- [ ] אין סודות בקוד (רק NEXT_PUBLIC_* משתנים)
- [ ] Firestore Security Rules מוגדרים נכון
- [ ] Authentication מוגבל ל-Authorized domains בלבד

## פתרון בעיות

אם משהו לא עובד:
1. בדוק את הלוגים ב-Vercel Dashboard > Deployments
2. בדוק את ה-Console בדפדפן (F12)
3. ודא שכל משתני הסביבה מוגדרים נכון
4. בדוק ש-Firebase Security Rules פורסמו

## קישורים שימושיים

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Firebase Console](https://console.firebase.google.com)
- [מדריך מפורט](./VERCEL_DEPLOY.md)
