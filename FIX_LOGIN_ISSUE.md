# 🔧 פתרון בעיית התחברות - INVALID_LOGIN_CREDENTIALS

## 🎯 הבעיה

כשמנסים להתחבר, Firebase מחזיר שגיאת `400 INVALID_LOGIN_CREDENTIALS`.

## ✅ רשימת בדיקות

### 1. בדוק שהמשתמש קיים ב-Firebase Console

1. עבור ל: **https://console.firebase.google.com**
2. בחר את הפרויקט שלך
3. בתפריט השמאלי, לחץ על **Authentication**
4. לחץ על הטאב **Users**
5. **חפש את האימייל שלך** (`LIORKATOV@GMAIL.COM` או `liorkatov@gmail.com`)
6. **אם המשתמש לא קיים:**
   - לחץ על **Add user** (או **הוסף משתמש**)
   - הזן את האימייל והסיסמה
   - לחץ **Add user**

### 2. בדוק ש-Email/Password Authentication מופעל

1. ב-Firebase Console > **Authentication**
2. לחץ על הטאב **Sign-in method** (או **שיטת התחברות**)
3. **ודא ש-Email/Password מופעל:**
   - חפש את "Email/Password" ברשימה
   - אם הוא **Disabled**, לחץ עליו ולחץ **Enable**
   - לחץ **Save**

### 3. בדוק שהדומיין מורשה

1. ב-Firebase Console > **Authentication**
2. לחץ על הטאב **Settings** (או **הגדרות**)
3. גלול למטה עד **Authorized domains** (דומיינים מורשים)
4. **ודא שהדומיין שלך ברשימה:**
   - `star-journey.vercel.app` (או הדומיין שלך)
   - אם לא, לחץ **Add domain** והוסף אותו

### 4. בדוק את הסיסמה

**אם המשתמש קיים אבל עדיין לא מצליח להתחבר:**

1. ב-Firebase Console > **Authentication** > **Users**
2. לחץ על המשתמש שלך
3. לחץ על **Reset password** (או **איפוס סיסמה**)
4. שלח אימייל איפוס סיסמה
5. שנה את הסיסמה דרך האימייל

### 5. בדוק את הלוגים בקונסול

1. פתח את הקונסול בדפדפן (F12)
2. לחץ על הטאב **Console**
3. נסה להתחבר שוב
4. **חפש את הלוגים:**
   - `Login error:`
   - `Error code:`
   - `Error message:`
   - `Full error object:`
5. **שלח את הלוגים** כדי לראות מה השגיאה המדויקת

## 🔍 בעיות נפוצות

### בעיה 1: המשתמש לא קיים
**פתרון:** צור את המשתמש ב-Firebase Console או הירשם דרך האפליקציה

### בעיה 2: Email/Password לא מופעל
**פתרון:** הפעל את Email/Password ב-Firebase Console > Authentication > Sign-in method

### בעיה 3: הדומיין לא מורשה
**פתרון:** הוסף את הדומיין ל-Authorized domains

### בעיה 4: הסיסמה שגויה
**פתרון:** אפס את הסיסמה דרך Firebase Console או דרך "שכחתי סיסמה" באפליקציה

### בעיה 5: האימייל ב-UPPERCASE
**פתרון:** Firebase לא רגיש ל-case של האימייל, אבל נסה עם lowercase: `liorkatov@gmail.com`

## 📝 מה לבדוק עכשיו

1. **האם המשתמש קיים ב-Firebase Console?**
   - אם לא, צור אותו או הירשם דרך האפליקציה

2. **האם Email/Password מופעל?**
   - אם לא, הפעל אותו

3. **האם הדומיין מורשה?**
   - אם לא, הוסף אותו

4. **מה הלוגים בקונסול אומרים?**
   - פתח את הקונסול ונסה להתחבר שוב
   - שלח את הלוגים כדי לראות מה השגיאה המדויקת

## 🆘 אם עדיין לא עובד

אם אחרי כל הבדיקות עדיין לא עובד:

1. **נסה ליצור משתמש חדש** דרך האפליקציה (הרשמה)
2. **אם ההרשמה עובדת אבל ההתחברות לא:**
   - זה אומר שהמשתמש הקיים לא תקין
   - מחק את המשתמש הישן ב-Firebase Console
   - צור אותו מחדש דרך האפליקציה

3. **בדוק את משתני הסביבה ב-Vercel:**
   - ודא שכל משתני ה-Firebase מוגדרים נכון
   - ודא שה-API key נכון

4. **בדוק את הלוגים ב-Vercel:**
   - Vercel Dashboard > Deployments > בחר את ה-deployment האחרון
   - בדוק את הלוגים שם
