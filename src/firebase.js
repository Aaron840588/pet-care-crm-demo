import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

// Production configuration is loaded via environment variables to prevent hardcoded credentials.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || "",
};

let app = null;
let db = null;
let auth = null;

if (!isDemo && firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig);
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
    auth = getAuth(app);
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
  }
}

export { db, auth };
