import { auth } from "@/lib/firebase";

/**
 * fetch() for Netlify functions that only signed-in staff may call: sends the
 * current user's Firebase ID token as a Bearer token, which
 * netlify/functions/require-role.ts verifies.
 */
export async function authedFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = await auth.currentUser?.getIdToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
