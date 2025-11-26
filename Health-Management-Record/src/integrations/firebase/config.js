// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration
// Get these values from Firebase Console > Project Settings > Your apps > Web app
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate that all required environment variables are set
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];
// measurementId is optional, so we don't require it

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing Firebase environment variables:', missingVars.join(', '));
  console.error('📝 Please create a .env file in the root directory with your Firebase configuration.');
  console.error('📖 See .env.example for the required format.');
  console.error('🔗 Get your Firebase config from: https://console.firebase.google.com/ > Project Settings > Your apps');
  
  throw new Error(
    `Firebase configuration is missing. Please set the following environment variables: ${missingVars.join(', ')}\n` +
    'Create a .env file in the root directory with your Firebase credentials.\n' +
    'See README.md for setup instructions.'
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser environment)
// Analytics will be initialized asynchronously
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported && !analytics) {
      analytics = getAnalytics(app);
      console.log('✅ Firebase Analytics initialized');
    }
  }).catch((error) => {
    console.warn('⚠️ Firebase Analytics not available:', error);
  });
}

export { analytics };

export default app;

