# Voyage — AI Travel Concierge

A full-stack AI travel planning app. The Express backend handles `/api/*` routes and serves the React frontend as static files from `dist/`.

---

## Deploy on Render

### 1. Create a Web Service

Go to [render.com](https://render.com) → New → **Web Service** → connect your GitHub repository (or upload the archive).

| Setting | Value |
|---|---|
| Environment | **Node** |
| Build Command | `npm install --legacy-peer-deps --ignore-scripts && npm run build` |
| Start Command | `node server.cjs` |

### 2. Set Environment Variables

In Render's **Environment** tab, add:

| Key | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | Set to `production` |
| `OPENAI_API_KEY` | Yes | Your OpenAI API key (`sk-...`) |
| `SESSION_SECRET` | Yes | Long random string — run `openssl rand -hex 32` to generate |
| `YOOKASSA_SHOP_ID` | Yes (for payments) | Your shop ID from ЮKassa dashboard |
| `YOOKASSA_SECRET_KEY` | Yes (for payments) | Your secret key from ЮKassa dashboard |
| `OPENAI_BASE_URL` | No | Custom OpenAI-compatible endpoint (optional) |

> **Do NOT set `PORT`** — Render injects it automatically.

### 3. YooKassa Webhook

After deploying, configure a webhook in your ЮKassa dashboard:

- **URL:** `https://your-app.onrender.com/api/yookassa/webhook`
- **Event:** `payment.succeeded`

### 4. Deploy

Click **Create Web Service**. Render will:
1. Run `npm install --legacy-peer-deps --ignore-scripts`
2. Run `npm run build` (Vite builds the React frontend into `dist/`)
3. Start the app with `node server.cjs`

---

## Important Notes

### Missing YooKassa Keys

If `YOOKASSA_SHOP_ID` / `YOOKASSA_SECRET_KEY` are not set, the payment screen will show a clear message instead of crashing. All other app features work normally without payment keys.

### Data Storage (Ephemeral Filesystem)

User accounts and route cache are stored in `data/users.json` and `data/route-cache.json`. On Render's free tier, **the filesystem resets on every redeploy**, meaning all user accounts are lost.

To fix this for production:
- Use **Render Disks** (persistent volume) — mount at `/data` and set `DATA_DIR=/data` as an env var
- Or migrate user storage to a database (PostgreSQL, MongoDB, etc.)

### Local Development

```bash
npm install --legacy-peer-deps
```

Create a `.env` file:
```
OPENAI_API_KEY=sk-...
SESSION_SECRET=local-dev-secret
YOOKASSA_SHOP_ID=your-shop-id
YOOKASSA_SECRET_KEY=your-secret-key
NODE_ENV=development
PORT=3000
```

Then run:
```bash
# Build frontend first
npm run build

# Start server
node server.cjs
```

---

## Project Structure

```
├── src/              React frontend source
│   ├── pages/        Route-level page components
│   │   ├── Paywall.tsx         YooKassa 799₽ payment screen
│   │   ├── PaymentSuccess.tsx  Post-payment success page
│   │   ├── PaymentFailed.tsx   Post-payment failure page
│   │   └── ...
│   ├── lib/
│   │   ├── auth-context.tsx    Auth + premium status management
│   │   └── ...
│   └── components/
├── public/           Static assets (favicon, images)
├── server.cjs        Express backend (auth, AI, YooKassa, saved trips)
├── data/             Runtime data dir — gitignored in production
├── index.html        Vite HTML entry point
├── vite.config.ts    Vite config
└── package.json      All dependencies — no workspace: or catalog: refs
```

---

## Files to Push to GitHub

Push everything **except** `node_modules/`, `dist/`, `data/users.json`, and `data/route-cache.json`:

```bash
git init
git add .
git commit -m "Initial Voyage deployment"
git remote add origin https://github.com/YOUR_USER/voyage.git
git push -u origin main
```

The `.gitignore` already excludes `node_modules/`, `dist/`, and `data/users.json` / `data/route-cache.json`.

---

## Payment Flow

1. User reaches `/paywall` after building their trip plan
2. Checks the legal checkbox: *"Я подтверждаю оплату 799₽ и ознакомился со всеми правилами сервиса"*
3. Clicks **"Оплатить 799₽"** → POST `/api/yookassa/create-payment`
4. Server creates payment via YooKassa API, returns `confirmation_url`
5. User is redirected to YooKassa's hosted payment page
6. After payment → YooKassa redirects to `/payment-success`
7. YooKassa fires webhook → `POST /api/yookassa/webhook` → sets `user.isPremium = true`
8. Success page polls `/api/payment/status` to confirm and update the UI
