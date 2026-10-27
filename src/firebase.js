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
// Load the optional SDK only for an explicitly configured cloud build. Public
// demo visitors do not download or execute Firebase authentication/Firestore.
let firestore;
let authentication;
let cloudDb = null;
let cloudAuth = null;
if (!isDemo) {
  const [{ initializeApp }, store, identity] = await Promise.all([
    import('firebase/app'), import('firebase/firestore'), import('firebase/auth'),
  ]);
  firestore = store;
  authentication = identity;
  const app = initializeApp(firebaseConfig);
  cloudDb = store.initializeFirestore(app, {
    localCache: store.persistentLocalCache({ tabManager: store.persistentMultipleTabManager() }),
  });
  cloudAuth = identity.getAuth(app);
}

/**
 * O4: Enable IndexedDB offline persistence (Firebase 12 API)
 * - persistentLocalCache: stores data in IndexedDB, survives network loss
 * - persistentMultipleTabManager: safe for multi-tab usage
 * - Falls back silently if IndexedDB unavailable (private browsing)
 */
export const db = cloudDb;
export const auth = cloudAuth;
const cloudCall = (sdk, name, args) => {
  if (!sdk) throw new Error('Cloud operations are unavailable in the public sample.');
  return sdk[name](...args);
};
export const collection = (...args) => cloudCall(firestore, 'collection', args);
export const onSnapshot = (...args) => cloudCall(firestore, 'onSnapshot', args);
export const addDoc = (...args) => cloudCall(firestore, 'addDoc', args);
export const updateDoc = (...args) => cloudCall(firestore, 'updateDoc', args);
export const deleteDoc = (...args) => cloudCall(firestore, 'deleteDoc', args);
export const doc = (...args) => cloudCall(firestore, 'doc', args);
export const serverTimestamp = (...args) => cloudCall(firestore, 'serverTimestamp', args);
export const writeBatch = (...args) => cloudCall(firestore, 'writeBatch', args);
export const query = (...args) => cloudCall(firestore, 'query', args);
export const orderBy = (...args) => cloudCall(firestore, 'orderBy', args);
export const limit = (...args) => cloudCall(firestore, 'limit', args);
export const onAuthStateChanged = (...args) => cloudCall(authentication, 'onAuthStateChanged', args);
export const signOut = (...args) => cloudCall(authentication, 'signOut', args);
export const signInWithEmailAndPassword = (...args) => cloudCall(authentication, 'signInWithEmailAndPassword', args);
