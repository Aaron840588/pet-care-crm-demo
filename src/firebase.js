import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            "AIzaSyB4EPHJWKzQNrdI6FXkt860d3W0Z3d5nnY",
  authDomain:        "petsit-manager.firebaseapp.com",
  projectId:         "petsit-manager",
  storageBucket:     "petsit-manager.firebasestorage.app",
  messagingSenderId: "631159403990",
  appId:             "1:631159403990:web:2a720c8a8eb34d0187a077",
};

const app = initializeApp(firebaseConfig);

/**
 * O4: Enable IndexedDB offline persistence (Firebase 12 API)
 * - persistentLocalCache: stores data in IndexedDB, survives network loss
 * - persistentMultipleTabManager: safe for multi-tab usage
 * - Falls back silently if IndexedDB unavailable (private browsing)
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const auth = getAuth(app);
