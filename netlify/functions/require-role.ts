/**
 * Caller check for Netlify Functions that only signed-in staff may run.
 *
 * The client sends the signed-in user's Firebase ID token as
 * "Authorization: Bearer <token>" (see src/lib/authed-fetch.ts). The role is read
 * the same way the admin panel reads it: the `role` custom claim first, then the
 * users/{uid} Firestore document as a fallback.
 */

import type { HandlerEvent, HandlerResponse } from '@netlify/functions';
import { getAuthService, getFirestoreDb } from './firebase-admin-init.js';

/**
 * Returns an error response to send back as-is, or null when the caller has one
 * of `roles`. Throws if Firebase Admin credentials are missing, so the calling
 * handler's own error handling reports that as a server error.
 */
export async function requireRole(
  event: HandlerEvent,
  roles: string[] = ['admin'],
): Promise<HandlerResponse | null> {
  const header = event.headers.authorization ?? event.headers.Authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Sign in to the admin panel to do this.' }) };
  }

  const auth = getAuthService();
  let uid: string;
  let claimRole: unknown;
  try {
    const decoded = await auth.verifyIdToken(token);
    uid = decoded.uid;
    claimRole = decoded.role;
  } catch {
    return { statusCode: 401, body: JSON.stringify({ error: 'Your sign-in has expired. Sign in again and retry.' }) };
  }

  let role = typeof claimRole === 'string' ? claimRole : undefined;
  if (!role) {
    const snap = await getFirestoreDb().collection('users').doc(uid).get();
    role = snap.data()?.role;
  }

  if (!role || !roles.includes(role)) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Your account is not allowed to do this.' }) };
  }
  return null;
}
