// ─────────────────────────────────────────────────────────────────────────────
// payment.ts — FACEMAX × ЮKassa live integration (NO demo mode)
//
// Flow:
//   1. Frontend calls startPayment() → POST /api/payment/create
//   2. Backend creates payment via YooKassa API (YOOKASSA_SHOP_ID + YOOKASSA_SECRET_KEY)
//   3. Backend returns { paymentId, confirmation_url }
//   4. Frontend does: window.location.href = confirmation_url
//   5. After payment, YooKassa redirects back to return_url (this app)
//   6. Frontend reads pendingPaymentId from sessionStorage
//   7. Polls GET /api/payment/status/:id until status === 'succeeded'
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
  confirmation_url?: string;
  error?: string;
}

export interface PaymentStatusResult {
  status: PaymentStatus;
  error?: string;
}

// ── Create payment ─────────────────────────────────────────────────────────────

/**
 * Start a new YooKassa payment session.
 * Calls POST /api/payment/create on the backend.
 * Returns { paymentId, confirmation_url } on success, { error } on failure.
 */
export async function startPayment(): Promise<StartPaymentResult> {
  try {
    const returnUrl = window.location.origin + window.location.pathname;

    const res = await fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnUrl }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[FACEMAX] /api/payment/create HTTP error:', res.status, text);
      return { error: `HTTP ${res.status}: ${text}` };
    }

    const data = (await res.json()) as {
      paymentId: string;
      confirmation_url: string;
      error?: string;
    };

    const { paymentId, confirmation_url } = data;

    // Diagnostic log — visible in DevTools → Console
    console.log('[FACEMAX] payment/create response:', { paymentId, confirmation_url });

    if (!confirmation_url) {
      console.error('[FACEMAX] confirmation_url отсутствует в ответе ЮKassa:', data);
      return { error: 'Не удалось создать ссылку на оплату' };
    }

    return { paymentId, confirmation_url };
  } catch (err) {
    console.error('[FACEMAX] startPayment exception:', err);
    return { error: String(err) };
  }
}

// ── Check payment status ───────────────────────────────────────────────────────

/**
 * Check the status of a payment by ID.
 * Calls GET /api/payment/status/:paymentId on the backend.
 */
export async function checkPaymentStatus(
  paymentId: string,
): Promise<PaymentStatusResult> {
  try {
    const res = await fetch(`/api/payment/status/${paymentId}`);
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
