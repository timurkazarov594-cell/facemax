# FACEMAX — AI Face Analysis
## Build: facemax-yookassa-live

Real YooKassa payment integration.
Flow: select → upload → analyze → LOCKED results → pay → FULL results.

---
## Setup

### 1. Set environment variables

On your server or in Replit Secrets:

  SHOP_ID     — ЮKassa номер магазина
  SECRET_KEY  — ЮKassa секретный ключ

Never commit real keys to version control.

### 2. Frontend (Vite / static site)

  cd frontend
  npm install
  npm run build        # outputs dist/
  # serve dist/ with any static host

Build command for Render/Netlify:  npm run build
Publish directory:                 dist

### 3. Backend (Express API)

  cd api-server
  npm install
  PORT=8080 node dist/index.mjs

The frontend calls /api/payments/create and /api/payments/:id/status
which are handled by the Express server.

---
## Payment flow

1. User completes analysis → sees locked results + paywall card
2. Clicks "Разблокировать за 199 ₽"
3. Frontend calls POST /api/payments/create
4. Backend creates YooKassa payment (uses SHOP_ID + SECRET_KEY)
5. Frontend saves paymentId to sessionStorage, redirects to confirmationUrl
6. User pays on YooKassa, is redirected back to the app
7. Frontend detects pendingPaymentId, restores saved analysis state
8. Frontend polls GET /api/payments/:id/status every 5 s
9. When status === "succeeded" → full results unlocked

---
## Demo mode (testing without real payment)

In frontend/src/lib/payment.ts, set:

  export const DEMO_MODE = true;

This unlocks immediately without calling the backend.

---
## Scoring

- Maxilla: wider range (4–9.5); 10 requires exceptional combined evidence
- Cheekbones: ratio-based hollow-cheek detection; no inflation floors
- Consistency: high maxilla ↔ jaw/cheekbones cannot contradict each other
