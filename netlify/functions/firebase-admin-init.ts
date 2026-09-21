/**
 * Firebase Admin SDK initialization helper for Netlify Functions.
 * Prefers FIREBASE_ADMIN_SDK_B64 (base64-encoded service account JSON) so the
 * credential never has to be committed to the repo. Falls back to a local
 * JSON file for deploys that hit AWS Lambda's ~4KB total env var limit and
 * bundle the credential file into the function instead (see .env.example).
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve } from 'path';

function loadServiceAccount(): Record<string, unknown> {
  const b64 = process.env.FIREBASE_ADMIN_SDK_B64;
  if (b64) {
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
  }

  // Fallback: a *-firebase-adminsdk-*.json file bundled alongside this function.
  const localFile = readdirSync(__dirname).find((f) => f.includes('firebase-adminsdk') && f.endsWith('.json'));
  if (localFile) {
    const credPath = resolve(__dirname, localFile);
    if (existsSync(credPath)) {
      return JSON.parse(readFileSync(credPath, 'utf-8'));
    }
  }

  throw new Error(
    'No Firebase Admin credentials found. Set FIREBASE_ADMIN_SDK_B64 (see .env.example) or place a *-firebase-adminsdk-*.json file in netlify/functions/.',
  );
}

/**
 * Get or create the Firebase Admin app instance.
 */
export function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  try {
    const serviceAccount = loadServiceAccount();
    const projectId = serviceAccount.project_id as string;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;

    return initializeApp({
      credential: cert(serviceAccount as never),
      storageBucket,
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw new Error(`Firebase Admin SDK initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get Firebase Storage bucket
 */
export function getStorageBucket(bucketName = process.env.FIREBASE_STORAGE_BUCKET) {
  const app = getAdminApp();
  return bucketName ? getStorage(app).bucket(bucketName) : getStorage(app).bucket();
}

/**
 * Get Firestore database
 */
export function getFirestoreDb() {
  const app = getAdminApp();
  return getFirestore(app);
}

/**
 * Get Firebase Auth
 */
export function getAuthService() {
  const app = getAdminApp();
  return getAuth(app);
}
