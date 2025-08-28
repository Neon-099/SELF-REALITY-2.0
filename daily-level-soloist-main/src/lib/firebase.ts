import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

// Centralized Firebase initialization for the app.
// Reads configuration from Vite environment variables.

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
};

function getOrInitApp(): FirebaseApp {
  const existing = getApps();
  if (existing.length > 0) return existing[0]!;
  return initializeApp(firebaseConfig);
}

export const firebaseApp = getOrInitApp();
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(firebaseApp);

let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;
(async () => {
  // Analytics only works in browser and with measurementId
  if (firebaseConfig.measurementId && (await isAnalyticsSupported())) {
    analyticsInstance = getAnalytics(firebaseApp);
  }
})().catch(() => {
  // no-op; analytics is optional
});

export const analytics = analyticsInstance;
