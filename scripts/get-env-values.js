#!/usr/bin/env node

/**
 * סקריפט להוצאת ערכי משתני הסביבה של Firebase
 * 
 * שימוש:
 *   node scripts/get-env-values.js
 *   או
 *   npm run get-env-values
 */

const fs = require('fs');
const path = require('path');

// צבעים ל-console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function readEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    return null;
  }
  
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
  
  return env;
}

function displayEnvValues(env) {
  log('\n📋 ערכי משתני הסביבה של Firebase:', 'bright');
  log('═'.repeat(60), 'cyan');
  
  const envVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];
  
  let allFound = true;
  
  envVars.forEach((key, index) => {
    const value = env[key];
    if (value) {
      log(`\n${index + 1}. ${key}:`, 'green');
      log(`   ${value}`, 'bright');
    } else {
      log(`\n${index + 1}. ${key}:`, 'red');
      log(`   ⚠️  לא נמצא`, 'yellow');
      allFound = false;
    }
  });
  
  log('\n' + '═'.repeat(60), 'cyan');
  
  return allFound;
}

function displayVercelFormat(env) {
  log('\n📦 פורמט להעתקה ל-Vercel:', 'bright');
  log('═'.repeat(60), 'cyan');
  
  const envVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];
  
  log('\nהוסף את המשתנים הבאים ב-Vercel Dashboard > Settings > Environment Variables:\n', 'yellow');
  
  envVars.forEach((key) => {
    const value = env[key];
    if (value) {
      log(`Key: ${key}`, 'green');
      log(`Value: ${value}`, 'cyan');
      log(`Environments: ✅ Production, ✅ Preview, ✅ Development\n`, 'blue');
    }
  });
}

function displayInstructions() {
  log('\n📖 הוראות:', 'bright');
  log('═'.repeat(60), 'cyan');
  log('\n1. עבור ל-Firebase Console: https://console.firebase.google.com', 'yellow');
  log('2. בחר את הפרויקט שלך', 'yellow');
  log('3. לחץ על ⚙️ Project Settings', 'yellow');
  log('4. גלול למטה ל-"Your apps"', 'yellow');
  log('5. לחץ על אפליקציית ה-Web שלך (</>)', 'yellow');
  log('6. העתק את הערכים מה-firebaseConfig', 'yellow');
  log('7. שמור אותם בקובץ .env.local בפרויקט', 'yellow');
  log('\nדוגמה לקובץ .env.local:', 'bright');
  log('─'.repeat(60), 'cyan');
  log(`
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
  `, 'cyan');
}

function main() {
  log('\n🔍 בודק משתני סביבה...', 'bright');
  
  const env = readEnvFile();
  
  if (!env) {
    log('\n⚠️  קובץ .env.local לא נמצא!', 'yellow');
    displayInstructions();
    process.exit(1);
  }
  
  const allFound = displayEnvValues(env);
  
  if (allFound) {
    log('\n✅ כל משתני הסביבה נמצאו!', 'green');
    displayVercelFormat(env);
  } else {
    log('\n⚠️  חלק ממשתני הסביבה חסרים!', 'yellow');
    displayInstructions();
  }
  
  log('\n💡 טיפ: העתק את הערכים למעלה והדבק ב-Vercel Dashboard', 'blue');
  log('   Vercel Dashboard > Project > Settings > Environment Variables\n', 'blue');
}

main();
