import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
} from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if we have a valid configuration to initialize Firebase
const isFirebaseConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId;

let app;
let auth: any;
let googleProvider: any;
let githubProvider: any;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    setPersistence(auth, browserSessionPersistence).catch((err: any) => {
      console.error('Firebase persistence setup error:', err);
    });
    googleProvider = new GoogleAuthProvider();
    githubProvider = new GithubAuthProvider();
  } catch (error) {
    console.error('Failed to initialize Firebase SDK:', error);
  }
} else {
  console.warn(
    'Firebase environment variables are missing. CyberSphere will run in local demo sandbox authentication mode.'
  );
}

export { auth, googleProvider, githubProvider, isFirebaseConfigured };

// Google Sign-In helper
export const signInWithGoogle = async () => {
  if (!isFirebaseConfigured || !auth) {
    // Return mock user in sandbox mode
    return {
      uid: 'sandbox-google-user',
      email: 'analyst.google@cybersphere.io',
      displayName: 'Google Sandbox Analyst',
      photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=google',
    };
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

// GitHub Sign-In helper
export const signInWithGithub = async () => {
  if (!isFirebaseConfigured || !auth) {
    // Return mock user in sandbox mode
    return {
      uid: 'sandbox-github-user',
      email: 'analyst.github@cybersphere.io',
      displayName: 'GitHub Sandbox Analyst',
      photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=github',
    };
  }
  const result = await signInWithPopup(auth, githubProvider);
  return result.user;
};

// Sign-Out helper
export const logOutFirebase = async () => {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  }
};

// Listen to Auth state change (wrapper)
export const subscribeToAuthChanges = (callback: (user: any) => void) => {
  if (!isFirebaseConfigured || !auth) {
    // In sandbox mode, trigger callback with null (not automatically logged in unless user clicks)
    // But we check our local auth state store.
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};
