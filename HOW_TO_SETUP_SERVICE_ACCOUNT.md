# איך להגדיר Firebase Service Account ב-Vercel

## מה זה Service Account?

Service Account הוא מפתח פרטי שמאפשר לשרת (כמו Vercel) לגשת ל-Firebase Admin SDK. זה נדרש כדי:
- לאמת ID tokens של משתמשים
- לגשת ל-Firestore עם הרשאות מלאות (bypass Security Rules)
- לבדוק אם משתמש הוא אדמין

## שלב 1: יצירת Service Account ב-Firebase

### 1. עבור ל-Firebase Console
1. פתח [Firebase Console](https://console.firebase.google.com)
2. בחר את הפרויקט שלך (`star-journey-app`)

### 2. עבור ל-Google Cloud Console
1. לחץ על ⚙️ **Project Settings** (בתפריט העליון)
2. לחץ על **Service accounts** (בתפריט השמאלי)
3. או עבור ישירות ל-[Google Cloud Console](https://console.cloud.google.com)
4. בחר את הפרויקט שלך (`star-journey-app`)

### 3. צור Service Account
1. בתפריט השמאלי, עבור ל **IAM & Admin** > **Service Accounts**
2. לחץ על **+ CREATE SERVICE ACCOUNT** (כפתור כחול למעלה)
3. מלא את הפרטים:
   - **Service account name:** `star-journey-server` (או כל שם שתרצה)
   - **Service account ID:** יווצר אוטומטית
   - **Description:** `Service account for Vercel server-side operations`
4. לחץ **CREATE AND CONTINUE**

### 4. הגדר הרשאות
1. ב-**Grant this service account access to project**, הוסף את התפקידים הבאים:
   - **Firebase Admin SDK Administrator Service Agent** (חובה!)
   - או **Editor** (אם הראשון לא קיים)
2. לחץ **CONTINUE**
3. לחץ **DONE**

### 5. צור מפתח (Key)
1. חזור ל-**Service Accounts**
2. מצא את ה-Service Account שיצרת
3. לחץ על ה-3 נקודות (⋮) מימין
4. בחר **Manage keys**
5. לחץ על **ADD KEY** > **Create new key**
6. בחר **JSON**
7. לחץ **CREATE**
8. **הקובץ יורד אוטומטית!** שמור אותו במקום בטוח

## שלב 2: קבלת הערך ל-Vercel

### 1. פתח את קובץ ה-JSON שהורד
הקובץ נראה כך:
```json
{
  "type": "service_account",
  "project_id": "star-journey-app",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "star-journey-server@star-journey-app.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### 2. המר ל-string אחד
אתה צריך להמיר את כל ה-JSON ל-string אחד (עם escape ל-newlines).

**דרך קלה:**
1. פתח את הקובץ ב-editor
2. העתק את כל התוכן
3. השתמש בכלי כמו [JSON Escape/Unescape](https://www.freeformatter.com/json-escape.html) או פשוט:
   - החלף כל `"` ב-`\"`
   - החלף כל `\n` ב-`\\n`
   - או פשוט העתק את כל התוכן כמו שהוא (Vercel יבין)

**או פשוט:**
העתק את כל התוכן של הקובץ JSON כמו שהוא, כולל כל ה-`\n` בתוך ה-private_key.

## שלב 3: הגדרה ב-Vercel

### 1. עבור ל-Vercel Dashboard
1. פתח [Vercel Dashboard](https://vercel.com/dashboard)
2. בחר את הפרויקט שלך (`star-journey`)

### 2. הוסף משתנה סביבה
1. לחץ על **Settings** (בתפריט העליון)
2. לחץ על **Environment Variables** (בתפריט השמאלי)
3. לחץ על **Add New** (כפתור כחול)

### 3. מלא את הפרטים
- **Key:** `FIREBASE_SERVICE_ACCOUNT`
- **Value:** העתק את כל התוכן של קובץ ה-JSON (כולל כל ה-`\n` בתוך ה-private_key)
- **Environment:** סמן את כל התיבות:
  - ✅ Production
  - ✅ Preview
  - ✅ Development

### 4. שמור
1. לחץ **Save**
2. **חשוב:** Vercel יבקש ממך ל-redploy את הפרויקט כדי שהשינויים ייכנסו לתוקף

## שלב 4: Redploy ב-Vercel

### דרך 1: דרך Dashboard
1. עבור ל-**Deployments**
2. מצא את ה-deployment האחרון
3. לחץ על ה-3 נקודות (⋮)
4. בחר **Redeploy**

### דרך 2: דרך Git
1. בצע commit קטן (למשל, עדכון README)
2. Push ל-Git
3. Vercel יבנה מחדש אוטומטית

## בדיקה שהכל עובד

1. פתח את האפליקציה ב-Vercel
2. התחבר כאדמין
3. עבור לדשבורד אדמין
4. בדוק את הגדרות טלגרם - אמור לעבוד בלי שגיאות 403

## פתרון בעיות

### שגיאה: "Admin SDK initialization failed"
- ודא שה-`FIREBASE_SERVICE_ACCOUNT` מוגדר נכון ב-Vercel
- ודא שהערך כולל את כל ה-JSON, כולל ה-`\n` בתוך ה-private_key
- ודא ש-redployed את הפרויקט אחרי הוספת המשתנה

### שגיאה: "Permission denied"
- ודא שה-Service Account יש לו את התפקיד **Firebase Admin SDK Administrator Service Agent**
- בדוק ב-Google Cloud Console > IAM & Admin > Service Accounts

### איך לבדוק אם המשתנה מוגדר?
1. ב-Vercel Dashboard > Settings > Environment Variables
2. חפש `FIREBASE_SERVICE_ACCOUNT`
3. אם הוא קיים - הוא מוגדר

## אבטחה

⚠️ **חשוב מאוד:**
- **לעולם אל תעלה את קובץ ה-JSON ל-Git!**
- **לעולם אל תחשוף את המפתח בפומבי!**
- הקובץ כבר ב-`.gitignore` - אל תסיר אותו!
- אם המפתח נחשף - מחק אותו מיד ב-Google Cloud Console וצור חדש

## סיכום

1. ✅ צור Service Account ב-Firebase/Google Cloud Console
2. ✅ הורד את קובץ ה-JSON
3. ✅ העתק את כל התוכן
4. ✅ הוסף ב-Vercel כ-`FIREBASE_SERVICE_ACCOUNT`
5. ✅ Redploy את הפרויקט
6. ✅ בדוק שהכל עובד

---

**קישורים שימושיים:**
- [Firebase Console](https://console.firebase.google.com)
- [Google Cloud Console](https://console.cloud.google.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
