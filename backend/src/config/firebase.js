import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { env } from './env.js';

function getFirebaseApp() {
  if (getApps().length) return getApps()[0];
  if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return initializeApp({ credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }) });
  }
  return initializeApp({ projectId: env.FIREBASE_PROJECT_ID || 'collabdock-local' });
}

export const firebaseAuth = getAuth(getFirebaseApp());
