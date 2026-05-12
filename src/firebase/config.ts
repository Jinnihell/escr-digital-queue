// Firebase configuration - loaded from environment variables
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim?.(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim?.(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim?.(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim?.(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim?.()
};
