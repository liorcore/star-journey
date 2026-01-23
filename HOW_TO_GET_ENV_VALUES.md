# 📋 איפה למצוא כל ערך של משתנה סביבה - מדריך שלב אחר שלב

> ⚠️ **אם אתה לא מוצא את הערכים ב-Firebase Console**, ראה את [FIREBASE_CONFIG_GUIDE.md](./FIREBASE_CONFIG_GUIDE.md) - מדריך מפורט יותר עם פתרון בעיות.

## 🎯 התחלה - כניסה ל-Firebase Console

1. פתח דפדפן ועבור ל: **https://console.firebase.google.com**
2. התחבר עם חשבון Google שלך
3. בחר את הפרויקט שלך מהרשימה (או צור פרויקט חדש)
4. **חשוב:** אם אין לך אפליקציית Web, צור אותה קודם! (ראה [FIREBASE_CONFIG_GUIDE.md](./FIREBASE_CONFIG_GUIDE.md))

---

## 📍 שלב 1: מציאת ה-Project Settings

### איפה זה נמצא?

1. בפינה השמאלית העליונה של המסך, לחץ על **⚙️ (גלגל שיניים)** ליד שם הפרויקט
2. או: לחץ על שם הפרויקט > **Project Settings**

---

## 📍 שלב 2: מציאת ה-firebaseConfig

### איפה זה נמצא?

1. אחרי שלחצת על **Project Settings**, תראה מספר טאבים: **General**, **Service accounts**, וכו'
2. תישאר על הטאב **General** (הוא כבר פתוח)
3. גלול **למטה** במסך עד שתראה כותרת: **"Your apps"** או **"SDK setup and configuration"**

### אם יש לך אפליקציה Web:

- תראה רשימה של אפליקציות (iOS, Android, Web)
- לחץ על אפליקציית ה-**Web** שלך (האייקון `</>`)
- תראה קוד JavaScript שנראה כך:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### אם אין לך אפליקציה Web:

1. לחץ על הכפתור **</> Add app** (או **Add another app**)
2. בחר **Web** (האייקון `</>`)
3. תן שם לאפליקציה (לדוגמה: "Star Journey")
4. לחץ **Register app**
5. עכשיו תראה את ה-`firebaseConfig` עם כל הערכים

---

## 🔍 שלב 3: איפה כל ערך נמצא ב-firebaseConfig

### 1️⃣ NEXT_PUBLIC_FIREBASE_API_KEY

**איפה למצוא:**
- ב-`firebaseConfig`, חפש את השורה: `apiKey: "..."`

**דוגמה:**
```javascript
apiKey: "AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456"
```
⬇️
**העתק את הערך בין המרכאות:**
```
AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456
```

**איך נראה:**
- מתחיל ב-`AIzaSy`
- אורך: כ-39 תווים
- זה המפתח הציבורי של Firebase - בטוח לחשיפה

---

### 2️⃣ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN

**איפה למצוא:**
- ב-`firebaseConfig`, חפש את השורה: `authDomain: "..."`

**דוגמה:**
```javascript
authDomain: "my-project-12345.firebaseapp.com"
```
⬇️
**העתק את הערך בין המרכאות:**
```
my-project-12345.firebaseapp.com
```

**איך נראה:**
- מסתיים ב-`.firebaseapp.com`
- בדרך כלל: `[project-id].firebaseapp.com`
- זה ה-domain של Firebase Authentication

---

### 3️⃣ NEXT_PUBLIC_FIREBASE_PROJECT_ID

**איפה למצוא:**
- ב-`firebaseConfig`, חפש את השורה: `projectId: "..."`

**דוגמה:**
```javascript
projectId: "my-project-12345"
```
⬇️
**העתק את הערך בין המרכאות:**
```
my-project-12345
```

**איך נראה:**
- זה שם הפרויקט שלך ב-Firebase
- יכול להכיל אותיות, מספרים ומקפים
- זה גם מופיע בראש הדף ב-Firebase Console

---

### 4️⃣ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET

**איפה למצוא:**
- ב-`firebaseConfig`, חפש את השורה: `storageBucket: "..."`

**דוגמה:**
```javascript
storageBucket: "my-project-12345.appspot.com"
```
⬇️
**העתק את הערך בין המרכאות:**
```
my-project-12345.appspot.com
```

**איך נראה:**
- מסתיים ב-`.appspot.com`
- בדרך כלל: `[project-id].appspot.com`
- זה ה-Storage Bucket של Firebase

---

### 5️⃣ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID

**איפה למצוא:**
- ב-`firebaseConfig`, חפש את השורה: `messagingSenderId: "..."`

**דוגמה:**
```javascript
messagingSenderId: "123456789012"
```
⬇️
**העתק את הערך בין המרכאות:**
```
123456789012
```

**איך נראה:**
- זה מספר (string) של 12 ספרות
- משמש ל-Firebase Cloud Messaging
- יכול להיות גם מספר קצר יותר

---

### 6️⃣ NEXT_PUBLIC_FIREBASE_APP_ID

**איפה למצוא:**
- ב-`firebaseConfig`, חפש את השורה: `appId: "..."`

**דוגמה:**
```javascript
appId: "1:123456789012:web:abcdef1234567890"
```
⬇️
**העתק את הערך בין המרכאות:**
```
1:123456789012:web:abcdef1234567890
```

**איך נראה:**
- פורמט: `1:[מספר]:web:[מספר/אותיות]`
- מתחיל ב-`1:` ואז מספר, ואז `:web:`, ואז מזהה
- זה המזהה הייחודי של האפליקציה שלך

---

## 📝 שלב 4: העתקה מדויקת

### ⚠️ חשוב מאוד:

1. **העתק בדיוק** - כולל כל התווים, ללא רווחים נוספים
2. **בלי מרכאות** - העתק רק את הערך, לא את המרכאות
3. **בלי רווחים** - ודא שאין רווחים לפני או אחרי הערך
4. **העתק את כל הערך** - גם אם הוא ארוך

### דוגמה נכונה ❌✅:

**❌ שגוי:**
```
AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456   (רווח בסוף)
"AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456" (עם מרכאות)
```

**✅ נכון:**
```
AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456
```

---

## 🎯 שלב 5: הוספה ל-Vercel

### איך להוסיף כל משתנה:

1. עבור ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחר את הפרויקט שלך
3. לחץ על **Settings** (בתפריט העליון)
4. לחץ על **Environment Variables** (בתפריט השמאלי)
5. עבור כל משתנה, בצע:

   **א. לחץ על "Add New" או הכפתור "+"**
   
   **ב. מלא את הפרטים:**
   - **Key:** `NEXT_PUBLIC_FIREBASE_API_KEY` (העתק בדיוק)
   - **Value:** העתק את הערך מ-Firebase (בלי מרכאות)
   
   **ג. סמן את כל התיבות:**
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
   
   **ד. לחץ "Save"**

6. **חזור על הפעולה** עבור כל 6 המשתנים

---

## 📋 טבלת סיכום - איפה כל ערך

| # | משתנה ב-Vercel | איפה ב-Firebase | איך נראה |
|---|---------------|----------------|----------|
| 1 | `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` ב-firebaseConfig | `AIzaSy...` (39 תווים) |
| 2 | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` ב-firebaseConfig | `xxx.firebaseapp.com` |
| 3 | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` ב-firebaseConfig | `my-project-12345` |
| 4 | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` ב-firebaseConfig | `xxx.appspot.com` |
| 5 | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` ב-firebaseConfig | `123456789012` (מספר) |
| 6 | `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` ב-firebaseConfig | `1:123:web:abc...` |

---

## 🖼️ איפה זה נראה ב-Firebase Console?

```
Firebase Console
├── [שם הפרויקט] ⚙️ ← לחץ כאן
│   └── Project Settings
│       └── General (טאב)
│           └── Your apps ← גלול למטה עד כאן
│               └── Web app (</>) ← לחץ כאן
│                   └── firebaseConfig ← כאן כל הערכים!
│                       ├── apiKey: "..." ← ערך #1
│                       ├── authDomain: "..." ← ערך #2
│                       ├── projectId: "..." ← ערך #3
│                       ├── storageBucket: "..." ← ערך #4
│                       ├── messagingSenderId: "..." ← ערך #5
│                       └── appId: "..." ← ערך #6
```

---

## ✅ בדיקה אחרונה

לפני שתסיים, ודא:

- [ ] יש לך 6 משתנים ב-Vercel
- [ ] כל משתנה מסומן עבור Production, Preview, Development
- [ ] העתקת את הערכים בלי מרכאות
- [ ] אין רווחים לפני או אחרי הערכים
- [ ] כל הערכים מהפרויקט הנכון ב-Firebase

---

## 🆘 אם אתה לא מוצא משהו

### לא רואה את "Your apps"?
- ודא שאתה בטאב **General** (לא Service accounts)
- גלול עוד יותר למטה

### לא רואה אפליקציית Web?
- לחץ על **</> Add app** > בחר **Web**
- תן שם ולחץ **Register app**

### הערכים נראים מוזרים?
- ודא שאתה בפרויקט הנכון
- נסה לרענן את הדף
- ודא שהעתקת את כל הערך (לא רק חלק)

---

## 💡 טיפים

1. **שמור את הערכים במקום בטוח** - תוכל להשתמש בהם שוב
2. **העתק-הדבק** - אל תקליד ידנית, זה יכול לגרום לשגיאות
3. **בדוק פעמיים** - ודא שהעתקת את כל הערך
4. **השתמש ב-Ctrl+F** - חפש את שם השדה ב-firebaseConfig

---

## 📞 תמיכה

אם עדיין יש בעיה:
- ודא שאתה בפרויקט הנכון ב-Firebase
- ודא שיש לך הרשאות לפרויקט
- נסה ליצור אפליקציית Web חדשה

---

## 🖥️ שימוש ב-CLI (אופציונלי)

### דרך 1: סקריפט Node.js (מומלץ)

אם יש לך קובץ `.env.local` עם הערכים, תוכל להריץ:

```bash
npm run get-env-values
```

הסקריפט יציג:
- ✅ את כל ערכי משתני הסביבה
- ✅ פורמט מוכן להעתקה ל-Vercel
- ⚠️ הוראות אם הערכים חסרים

### דרך 2: Firebase CLI (מידע מוגבל)

Firebase CLI יכול להציג מידע על הפרויקט, אבל לא את ה-firebaseConfig ישירות:

```bash
# התקנת Firebase CLI (אם לא מותקן)
npm install -g firebase-tools

# התחברות
firebase login

# רשימת פרויקטים
firebase projects:list

# מידע על פרויקט (לא כולל firebaseConfig)
firebase use <project-id>
```

**הערה:** Firebase CLI לא יכול להוציא את ה-firebaseConfig ישירות. הדרך הקלה ביותר היא דרך Firebase Console או הסקריפט שיצרנו.

### דרך 3: קריאה מ-.env.local

אם כבר יש לך קובץ `.env.local`:

```bash
# Windows (PowerShell)
Get-Content .env.local | Select-String "NEXT_PUBLIC_FIREBASE"

# Linux/Mac
cat .env.local | grep NEXT_PUBLIC_FIREBASE
```

או פשוט פתח את הקובץ `.env.local` בעורך הטקסט.
