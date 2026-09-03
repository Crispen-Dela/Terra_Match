// Firebase initialization for web app (modular SDK)
// Replace the VITE_* env vars in .env with values from your Firebase project.
// This module performs a strict startup-time validation of required env vars
// and guards initialization during Vite HMR to avoid duplicate-app errors.
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Collect required environment variables in one place so it's easy to test.
const requiredEnv = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_DATABASE_URL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Detect any missing required values and fail fast with a helpful message.
const missing = Object.entries(requiredEnv).filter(([, v]) => v === undefined || v === null || v === '');
if (missing.length > 0) {
  const names = missing.map(([k]) => k).join(', ');
  // Throwing makes missing configuration immediately obvious in dev and CI.
  throw new Error(
    `Missing required environment variables for Firebase: ${names}.\n` +
      `Add them to your .env (see .env.example) and restart the dev server.`
  );
}

const firebaseConfig = {
  apiKey: requiredEnv.VITE_FIREBASE_API_KEY,
  authDomain: requiredEnv.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: requiredEnv.VITE_FIREBASE_DATABASE_URL,
  projectId: requiredEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: requiredEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: requiredEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: requiredEnv.VITE_FIREBASE_APP_ID,
};

// Guard initialization for Vite HMR: only initialize if no apps are present.
// This prevents "app already exists" errors when modules are re-evaluated.
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export default app;
