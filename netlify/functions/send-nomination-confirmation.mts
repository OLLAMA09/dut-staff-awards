import { Handler, HandlerEvent } from '@netlify/functions';
import emailjs from '@emailjs/nodejs';
import { FieldValue } from 'firebase-admin/firestore';
import { getFirestoreDb } from './firebase-admin-init.js';

/**
 * Netlify Function: Email the nominator a receipt for their nomination
 *
 * Called by the public nomination form right after a successful submit, with only
 * the nomination's id. The recipient and every value in the email are read from
 * that Firestore document, and each nomination gets at most one receipt
 * (tracked in `confirmationSentAt`), so this unauthenticated endpoint can't be
 * used to send arbitrary email.
 * Requires: VITE_EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY, VITE_EMAILJS_SERVICE_ID,
 * VITE_EMAILJS_CONFIRMATION_TEMPLATE_ID and FIREBASE_ADMIN_SDK_B64 environment variables
 */

const EMAILJS_PUBLIC_KEY = process.env.VITE_EMAILJS_PUBLIC_KEY || '';
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || '';
const EMAILJS_SERVICE_ID = process.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_CONFIRMATION_TEMPLATE_ID = process.env.VITE_EMAILJS_CONFIRMATION_TEMPLATE_ID || '';

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Check for required environment variables
    if (!EMAILJS_PUBLIC_KEY || !EMAILJS_PRIVATE_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_CONFIRMATION_TEMPLATE_ID) {
      console.error('Missing EmailJS configuration for nomination receipts');
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'EmailJS not configured. Set VITE_EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY, VITE_EMAILJS_SERVICE_ID, and VITE_EMAILJS_CONFIRMATION_TEMPLATE_ID',
        }),
      };
    }

    const { nominationId } = JSON.parse(event.body || '{}') as { nominationId?: string };
    if (typeof nominationId !== 'string' || !/^[A-Za-z0-9]{10,40}$/.test(nominationId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing or invalid nominationId' }),
      };
    }

    // Claim the receipt inside a transaction so two calls can't both send it.
    const db = getFirestoreDb();
    const ref = db.collection('nominations').doc(nominationId);
    const nomination = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.get('confirmationSentAt')) return null;
      tx.update(ref, { confirmationSentAt: FieldValue.serverTimestamp() });
      return snap.data() ?? null;
    });

    if (!nomination?.nominatorEmail) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, skipped: true }),
      };
    }

    // Initialize EmailJS with private key (server-side)
    emailjs.init({
      publicKey: EMAILJS_PUBLIC_KEY,
      privateKey: EMAILJS_PRIVATE_KEY,
    });

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CONFIRMATION_TEMPLATE_ID, {
        to_email: nomination.nominatorEmail,
        nominator_name: nomination.nominatorName,
        nominee_name: nomination.nomineeName,
        category_name: nomination.categoryName,
        reference: nominationId,
        site_url: process.env.URL || 'https://registrars-ambit-staff-awards.netlify.app',
        current_year: new Date().getFullYear(),
      });
    } catch (error) {
      // Release the claim so a later call can retry the receipt.
      await ref.update({ confirmationSentAt: FieldValue.delete() });
      throw error;
    }

    console.log(`✓ Nomination receipt sent for ${nominationId}`);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    // EmailJS rejects with { status, text } rather than an Error
    const errorMsg = error instanceof Error ? error.message : (error as { text?: string })?.text || 'Internal server error';
    console.error('Error in send-nomination-confirmation function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMsg }),
    };
  }
};
