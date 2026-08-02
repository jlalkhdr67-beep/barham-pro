import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfigJson from '../../../firebase-applet-config.json';

// Initialize Firebase configuration with environment variables fallback
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId || '',
};

// Singleton App Instance
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

console.log('[Firebase Config] Initialized Firebase App with Project ID:', firebaseConfig.projectId, 'AuthDomain:', firebaseConfig.authDomain);

// Firebase Auth Service
export const auth: Auth = getAuth(app);

// Firestore Database Service
const firestoreDbId = firebaseConfigJson.firestoreDatabaseId || '(default)';
export const db: Firestore = getFirestore(app, firestoreDbId);

// Firebase Storage Service (Ready for future uploads)
let firebaseStorage: FirebaseStorage | null = null;
try {
  firebaseStorage = getStorage(app);
} catch (err) {
  console.warn('Firebase Storage initialization warning:', err);
}

export const storage = firebaseStorage;
