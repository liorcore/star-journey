# הוראות פריסה ל-Vercel

מדריך זה מסביר כיצד לפרוס את האפליקציה ב-Vercel תוך שמירה על אבטחת מידע.

## דרישות מוקדמות

1. חשבון Vercel (ניתן ליצור בחינם ב-[vercel.com](https://vercel.com))
2. חשבון Firebase עם פרויקט מוגדר
3. Git repository (GitHub, GitLab, או Bitbucket)

## שלב 1: הכנת משתני הסביבה

### א. קבלת פרטי Firebase

1. עבור ל-[Firebase Console](https://console.firebase.google.com)
2. בחר את הפרויקט שלך
3. עבור ל-**Project Settings** (⚙️) > **General**
4. גלול למטה ל-**Your apps** ובחר את האפליקציה שלך (או צור חדשה)
5. העתק את הערכים מ-`firebaseConfig`:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### ב. הגדרת משתני סביבה ב-Vercel

**חשוב:** משתנים עם `NEXT_PUBLIC_` נחשפים בקוד הלקוח. זה בטוח עבור Firebase config, אבל לא להזין סודות!

1. עבור ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחר את הפרויקט שלך (או צור חדש)
3. עבור ל-**Settings** > **Environment Variables**
4. הוסף את המשתנים הבאים:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

5. **חשוב:** סמן את כל הסביבות (Production, Preview, Development)
6. לחץ **Save**

## שלב 2: פריסה

### אופציה 1: פריסה דרך Vercel Dashboard

1. עבור ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. לחץ **Add New Project**
3. בחר את ה-repository שלך
4. Vercel יזהה אוטומטית שזה Next.js project
5. ודא שההגדרות הבאות נכונות:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next` (ברירת מחדל)
6. לחץ **Deploy**

### אופציה 2: פריסה דרך Vercel CLI

```bash
# התקנת Vercel CLI
npm i -g vercel

# התחברות ל-Vercel
vercel login

# פריסה
vercel

# לפריסה ל-production
vercel --prod
```

## שלב 3: הגדרת Firebase Security Rules

**חשוב מאוד:** ודא שהכללים ב-Firestore מוגדרים נכון!

1. עבור ל-Firebase Console > **Firestore Database** > **Rules**
2. ודא שהכללים תואמים ל-`firestore.rules` בפרויקט
3. לחץ **Publish** כדי להחיל את הכללים

## שלב 4: בדיקת הפריסה

לאחר הפריסה:

1. פתח את ה-URL שקיבלת מ-Vercel
2. בדוק שהאפליקציה נטענת
3. נסה להתחבר עם Firebase Authentication
4. בדוק ש-Firestore עובד (יצירת קבוצה, אירוע וכו')

## אבטחת מידע - נקודות חשובות

### ✅ בטוח לחשיפה (NEXT_PUBLIC_*)
- `NEXT_PUBLIC_FIREBASE_API_KEY` - זה בטוח, זה לא סוד
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - זה בטוח
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - זה בטוח
- כל משתני ה-Firebase config - בטוחים לחשיפה

### ❌ לעולם לא לחשוף
- Private keys של Firebase Admin SDK
- Service account keys
- API secrets אחרים
- סיסמאות או tokens פרטיים

### הגנה ב-Firebase
- כל האבטחה מתבצעת ב-**Firestore Security Rules**
- ה-API key של Firebase לא מספיק לגישה - צריך הרשאות ב-Security Rules
- ודא ש-`firestore.rules` מוגדר נכון!

## פתרון בעיות

### הפריסה נכשלה
1. בדוק את הלוגים ב-Vercel Dashboard > **Deployments**
2. ודא שכל משתני הסביבה מוגדרים
3. בדוק שהקוד מתקמפל: `npm run build`

### Firebase לא עובד
1. ודא שכל משתני הסביבה מוגדרים ב-Vercel
2. בדוק את ה-console בדפדפן לשגיאות
3. ודא ש-Firebase Security Rules מוגדרים נכון

### Authentication לא עובד
1. בדוק ש-Email/Password ו-Google Sign-In מופעלים ב-Firebase Console
2. **חשוב:** הוסף את ה-URL של Vercel ל-Authorized domains:
   - עבור ל-Firebase Console > **Authentication** > **Settings** > **Authorized domains**
   - הוסף את ה-URL של Vercel (לדוגמה: `your-app.vercel.app`)
   - הוסף גם את ה-production domain אם יש לך אחד
3. ודא ש-Google OAuth Client ID מוגדר נכון (אם משתמשים ב-Google Sign-In)

## עדכונים עתידיים

כל push ל-`main`/`master` יגרום לפריסה אוטומטית ל-production.
כל branch אחר יגרום לפריסה ל-preview environment.

## תמיכה

לשאלות או בעיות:
- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
