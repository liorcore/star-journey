This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

הפרויקט מוכן לפריסה ב-Vercel.

### הוראות מפורטות

ראה את [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) למדריך מפורט לפריסה תוך שמירה על אבטחת מידע.

### סיכום מהיר

1. **הגדר משתני סביבה ב-Vercel:**
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

2. **חבר את ה-repository ל-Vercel** דרך [Vercel Dashboard](https://vercel.com/dashboard)

3. **ודא ש-Firebase Security Rules מוגדרים** - ראה `firestore.rules`

### אבטחת מידע

- ✅ כל משתני ה-Firebase config בטוחים לחשיפה (NEXT_PUBLIC_*)
- ✅ האבטחה מתבצעת ב-Firestore Security Rules
- ✅ `.env.local` לא נשמר ב-Git (כבר ב-.gitignore)

למידע נוסף, ראה [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md).
