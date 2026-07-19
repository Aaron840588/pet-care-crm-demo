const unavailableInDemo = () => {
  throw new Error('Firebase is unavailable in the isolated public demo build.');
};

export const addDoc = unavailableInDemo;
export const collection = unavailableInDemo;
export const deleteDoc = unavailableInDemo;
export const doc = unavailableInDemo;
export const getAuth = unavailableInDemo;
export const initializeApp = unavailableInDemo;
export const initializeFirestore = unavailableInDemo;
export const limit = unavailableInDemo;
export const onAuthStateChanged = unavailableInDemo;
export const onSnapshot = unavailableInDemo;
export const orderBy = unavailableInDemo;
export const persistentLocalCache = unavailableInDemo;
export const persistentMultipleTabManager = unavailableInDemo;
export const query = unavailableInDemo;
export const serverTimestamp = unavailableInDemo;
export const signInWithEmailAndPassword = unavailableInDemo;
export const signOut = unavailableInDemo;
export const updateDoc = unavailableInDemo;
export const writeBatch = unavailableInDemo;
