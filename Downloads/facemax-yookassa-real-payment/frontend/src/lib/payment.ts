// ─────────────────────────────────────────────────────────────────────────────
// payment.ts — FACEMAX × ЮKassa live integration (NO demo mode)
//
// Flow:
//   1. Frontend calls startPayment() → POST /api/create-payment
//   2. Backend creates payment via YooKassa API (YOOKASSA_SHOP_ID + YOOKASSA_SECRET_KEY)
//   3. Frontend saves paymentId + analysis state to sessionStorage
//   4. Frontend redirects user to confirmationUrl (YooKassa payment page)
//   5. After payment, YooKassa redirects back to return_url (this app)
//   6. Frontend reads pendingPaymentId from sessionStorage
//   7. Polls checkPaymentStatus() until status === 'succeeded'
//   8. Only then: isPremiumUnlocked = true
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentStatus =
  | 'pending'
  | 'waiting_for_capture'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export interface StartPaymentResult {
  paymentId?: string;
  confirmationUrl?: string;
  error?: string;
}

export interface PaymentStatusResult {
  status: PaymentStatus;
  error?: string;
}

// ── Create payment ─────────────────────────────────────────────────────────────

/**
 * Start a new YooKassa payment session.
 * Calls POST /api/create-payment on the backend.
 * Returns { paymentId, confirmationUrl } on success, { error } on failure.
 */
export async function startPayment(): Promise<StartPaymentResult> {
  try {
    const returnUrl = window.location.origin + window.location.pathname;

    const res = await fetch('/api/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnUrl }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { error: `HTTP ${res.status}: ${text}` };
    }

    const { paymentId, confirmationUrl } = (await res.json()) as {
      paymentId: string;
      confirmationUrl: string;
    };

    return { paymentId, confirmationUrl };
  } catch (err) {
    return { error: String(err) };
  }
}

// ── Check payment status ───────────────────────────────────────────────────────

/**
 * Check the status of a payment by ID.
 * Calls GET /api/check-payment/:paymentId on the backend.
 */
export async function checkPaymentStatus(
  paymentId: string,
): Promise<PaymentStatusResult> {
  try {
    const res = await fetch(`/api/check-payment/${paymentId}`);
    if (!res.ok) return { status: 'failed', error: `HTTP ${res.status}` };
    return (await res.json()) as PaymentStatusResult;
  } catch (err) {
    return { status: 'failed', error: String(err) };
  }
}

// ── Post-payment cleanup ───────────────────────────────────────────────────────

/**
 * Clear sessionStorage after confirmed successful payment.
 * Only call when checkPaymentStatus() returned 'succeeded'.
 */
export function unlockAfterPaymentSuccess(paymentId: string): void {
  sessionStorage.removeItem('facemax_pending_payment_id');
  sessionStorage.removeItem('facemax_saved_state');
  console.info('[FACEMAX] Premium unlocked — payment confirmed:', paymentId);
}
