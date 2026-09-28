import { Handler, HandlerEvent } from '@netlify/functions';
import emailjs from '@emailjs/nodejs';
import { requireRole } from './require-role.js';

/**
 * Netlify Function: Remind a judge to finish scoring
 *
 * Called from the admin panel's "Alert Judge" button (Judges with Incomplete Submissions).
 * Requires: VITE_EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY, VITE_EMAILJS_SERVICE_ID,
 * VITE_EMAILJS_JUDGE_ALERT_TEMPLATE_ID environment variables
 */

const EMAILJS_PUBLIC_KEY = process.env.VITE_EMAILJS_PUBLIC_KEY || '';
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || '';
const EMAILJS_SERVICE_ID = process.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_JUDGE_ALERT_TEMPLATE_ID = process.env.VITE_EMAILJS_JUDGE_ALERT_TEMPLATE_ID || '';

interface JudgeAlertRequest {
  judgeEmail: string;
  incompleteCount: number;
  nomineeNames: string[];
}

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const denied = await requireRole(event);
    if (denied) return denied;

    // Check for required environment variables
    if (!EMAILJS_PUBLIC_KEY || !EMAILJS_PRIVATE_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_JUDGE_ALERT_TEMPLATE_ID) {
      console.error('Missing EmailJS configuration for judge alerts');
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'EmailJS not configured. Set VITE_EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY, VITE_EMAILJS_SERVICE_ID, and VITE_EMAILJS_JUDGE_ALERT_TEMPLATE_ID',
        }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { judgeEmail, incompleteCount = 0, nomineeNames = [] } = body as JudgeAlertRequest;

    if (!judgeEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required field: judgeEmail' }),
      };
    }

    // Initialize EmailJS with private key (server-side)
    emailjs.init({
      publicKey: EMAILJS_PUBLIC_KEY,
      privateKey: EMAILJS_PRIVATE_KEY,
    });

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_JUDGE_ALERT_TEMPLATE_ID, {
        to_email: judgeEmail,
        incomplete_count: incompleteCount,
        nominee_list: nomineeNames.join('\n• '),
        judge_url: `${process.env.URL || 'https://registrars-ambit-staff-awards.netlify.app'}/judge`,
        current_year: new Date().getFullYear(),
      });

      console.log(`✓ Judge alert sent to ${judgeEmail}`);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, email: judgeEmail }),
      };
    } catch (error) {
      // EmailJS rejects with { status, text } rather than an Error
      const errorMsg = error instanceof Error ? error.message : (error as { text?: string })?.text || 'Failed to send';
      console.error(`✗ Failed to send judge alert to ${judgeEmail}:`, error);
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, email: judgeEmail, error: errorMsg }),
      };
    }
  } catch (error) {
    console.error('Error in send-judge-alert function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
    };
  }
};
