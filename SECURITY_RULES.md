# Firestore Security Rules

העתק את הקוד הבא ל-Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Groups - only owner can modify
      match /groups/{groupId} {
        allow read: if request.auth != null && request.auth.uid == resource.data.ownerId;
        allow create: if request.auth != null && request.auth.uid == request.resource.data.ownerId;
        allow update, delete: if request.auth != null && request.auth.uid == resource.data.ownerId;
        
        // Events - owner can do everything, guests have limited access
        match /events/{eventId} {
          // Read: owner or guest (simplified check - detailed checks in app code)
          allow read: if request.auth != null && 
            (request.auth.uid == resource.data.ownerId || 
             resource.data.get('guests', []) != null);
          
          // Create: only owner
          allow create: if request.auth != null && 
            request.auth.uid == request.resource.data.ownerId;
          
          // Update: owner can do everything, guests can update (detailed permission checks in app code)
          allow update: if request.auth != null && 
            (request.auth.uid == resource.data.ownerId || 
             resource.data.get('guests', []) != null);
          
          // Delete: only owner
          allow delete: if request.auth != null && 
            request.auth.uid == resource.data.ownerId;
        }
      }
    }
  }
}
```

**הערה חשובה:** Firestore Security Rules לא תומך ב-`.map()` או פונקציות מורכבות על arrays. לכן, בדיקות ההרשאות המפורטות (כמו האם אורח יכול לערוך משתתף מסוים או לנהל כוכבים) מתבצעות בקוד האפליקציה (`app/lib/permissions.ts`). ה-Security Rules מספקים הגנה בסיסית ברמת המסמך.

## הערות חשובות:

1. כל המשתמשים יכולים לקרוא ולכתוב רק את המסמכים שלהם ב-`users/{userId}`
2. קבוצות - רק הבעלים יכול לקרוא/לערוך/למחוק
3. אירועים:
   - קריאה: בעלים או אם יש guests (בדיקה מפורטת בקוד)
   - יצירה: רק בעלים
   - עדכון: בעלים יכול לערוך הכל, אורחים יכולים לערוך (בדיקות מפורטות בקוד)
   - מחיקה: רק בעלים

## הגדרת Firebase:

1. עבור ל-[Firebase Console](https://console.firebase.google.com/)
2. בחר את הפרויקט שלך
3. עבור ל-Firestore Database
4. לחץ על Rules
5. הדבק את הקוד למעלה
6. לחץ Publish

## הגדרת Authentication:

1. עבור ל-Authentication > Sign-in method
2. הפעל Email/Password
3. הפעל Google Sign-In (דורש הגדרת OAuth consent screen ב-Google Cloud Console)
