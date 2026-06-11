// ─────────────────────────────────────────────────────────────────────────────
// payment.ts — FACEMAX × ЮKassa live integration
//
// Flow:
//   1. Frontend calls startPayment() → POST /api/payments/create
//   2. Backend creates payment via YooKassa API (SHOP_ID + SECRET_KEY)
//   3. Frontend saves paymentId + analysis state to sessionStorage
//   4. Frontend redirects user to confirmationUrl (YooKassa payment page)
//   5. After payment, YooKassa redirects back to return_url (this app)
//   6. Frontend reads pendingPaymentId from sessionStorage
//   7. Polls checkPaymentStatus() until status === 'succeeded'
//   8. Calls unlockAfterPaymentSuccess() → isPremiumUnlocked = true
//
// To switch to demo mode for testing: set DEMO_MODE = true below.
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'waiting_for_capture' | 'succeeded' | 'failed' | 'cancelled';

export interface StartPaymentResult {
  available: boolean;
  demo?: boolean;
  paymentId?: string;
  confirmationUrl?: string;
  error?: string;
}

export interface PaymentStatusResult {
  status: PaymentStatus;
  error?: string;
}

// ── Feature flag ───────────────────────────────────────────────────────────────
/**
 * DEMO_MODE = true  → кнопка сразу открывает анализ (для тестирования).
 * DEMO_MODE = false → реальная оплата через ЮKassa.
 *                     Требует SHOP_ID и SECRET_KEY на бэкенде.
 */
export const DEMO_MODE = false;

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Start a new YooKassa payment session.
 * Calls POST /api/payments/create on the backend.
 * On success: returns { available: true, paymentId, confirmationUrl }.
 */
export async function startPayment(): Promise<StartPaymentResult> {
  if (DEMO_MODE) {
    return { available: true, demo: true };
  }

  try {
    // Use current page as return_url — YooKassa redirects here after payment
    const returnUrl = window.location.origin + window.location.pathname;

    const res = await fetch('/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnUrl }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { available: true, error: `HTTP ${res.status}: ${text}` };
    }

    const { paymentId, confirmationUrl } = (await res.json()) as {
      paymentId: string;
      confirmationUrl: string;
    };

    return { available: true, paymentId, confirmationUrl };
  } catch (err) {
    return { available: true, error: String(err) };
  }
}

/**
 * Check the status of a payment by ID.
 * Calls GET /api/payments/:id/status on the backend.
 */
export async function checkPaymentStatus(
  paymentId: string,
): Promise<PaymentStatusResult> {
  try {
    const res = await fetch(`/api/payments/${paymentId}/status`);
    if (!res.ok) return { status: 'failed', error: `HTTP ${res.status}` };
    return (await res.json()) as PaymentStatusResult;
  } catch (err) {
    return { status: 'failed', error: String(err) };
  }
}

/**
 * Grant premium access after confirmed payment.
 * Only call when checkPaymentStatus() returns 'succeeded'.
 */
export function unlockAfterPaymentSuccess(paymentId: string): void {
  sessionStorage.removeItem('facemax_pending_payment_id');
  sessionStorage.removeItem('facemax_saved_state');
  console.log('[FACEMAX] Premium unlocked after confirmed payment:', paymentId);
}
