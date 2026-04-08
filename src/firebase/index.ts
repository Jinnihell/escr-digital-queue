import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set auth language and domain for password reset emails
auth.languageCode = 'en';
auth.settings.appVerificationDisabledForTesting = false;

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Action Code Settings for password reset
export const actionCodeSettings = {
  url: 'https://queuebyescr.web.app/login?reset=true',
  handleCodeInApp: true,
};

export default app;
