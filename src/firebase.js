import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Public demo builds need no cloud project or credentials.
const isDemo = import.meta.env.VITE_DEMO_MODE !== 'false';
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
if (!isDemo && (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId || !firebaseConfig.appId)) {
  throw new Error('Cloud mode requires an explicitly configured Firebase project.');
}
const app = isDemo ? null : initializeApp(firebaseConfig);

/**
 * O4: Enable IndexedDB offline persistence (Firebase 12 API)
 * - persistentLocalCache: stores data in IndexedDB, survives network loss
 * - persistentMultipleTabManager: safe for multi-tab usage
 * - Falls back silently if IndexedDB unavailable (private browsing)
 */
export const db = isDemo ? null : initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const auth = isDemo ? null : getAuth(app);
