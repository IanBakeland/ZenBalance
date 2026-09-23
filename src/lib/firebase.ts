import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';

/**
 * Firebase web config, read from `.env.local` (git-ignored — PROJECT_PLAN.md
 * section 8). Copy `.env.example` to `.env.local` and fill it in from the
 * Firebase console. Expo inlines `EXPO_PUBLIC_*` at build time, so each one
 * has to be read with plain dot access like below.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** False until `.env.local` exists — Together then shows a "not set up" state instead of crashing. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let db: Firestore | null = null;

/** Lazily initialised, so solo users never pay for (or crash on) Firebase. */
export function getDb(): Firestore {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured');
  if (db) return db;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  try {
    // React Native has no WebChannel streaming; long polling is what the
    // Firestore web SDK needs to hold a live listener on a phone.
    db = initializeFirestore(app, { experimentalForceLongPolling: true });
  } catch {
    // Fast refresh re-runs this module after Firestore was already initialised.
    db = getFirestore(app);
  }
  return db;
}

/**
 * Firestore writes made offline don't reject — they wait for a connection
 * forever. Everything user-facing goes through this so the app never hangs.
 */
export function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
