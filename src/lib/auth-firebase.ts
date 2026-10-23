// Firebase Auth service — Registrar's Ambit Staff Awards
// Email/password sign-in, sign-up and sign-out helpers

import { initializeApp, deleteApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  initializeAuth,
  inMemoryPersistence,
  type User,
  type UserCredential,
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import app, { auth } from "./firebase";

/** Register a new admin account with email + password */
export async function registerUser(email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Create an account on someone else's behalf (admin panel) without touching the current session.
 * createUserWithEmailAndPassword signs the new user in, so it runs on a throwaway app instance;
 * the users/{uid} doc is written as the new user, same as self-registration.
 */
export async function createAccountForUser(
  email: string,
  password: string,
  role: "admin" | "judge",
): Promise<User> {
  const secondaryApp = initializeApp(app.options, `account-creation-${Date.now()}`);
  try {
    const secondaryAuth = initializeAuth(secondaryApp, { persistence: inMemoryPersistence });
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await setDoc(doc(getFirestore(secondaryApp), "users", cred.user.uid), {
      email: cred.user.email,
      role,
      createdAt: serverTimestamp(),
    });
    await firebaseSignOut(secondaryAuth);
    return cred.user;
  } finally {
    await deleteApp(secondaryApp);
  }
}

/** Sign in an existing admin with email + password */
export async function signIn(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

/** Sign out the current user */
export async function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

/** Send a password-reset email */
export async function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

/** Subscribe to auth state changes — returns an unsubscribe function */
export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/** Get the currently signed-in user (or null) */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}
