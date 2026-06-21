# SpeakTutor AI

Персональный ИИ-репетитор английского языка для русскоязычных. Практикуйте устную речь в реальных сценариях, получайте мгновенные исправления грамматики и прокачивайте свой уровень.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Tailwind CSS v4, Wouter v3, TanStack Query |
| Backend | Node.js 24, Express 5, TypeScript 5.9 |
| Database | PostgreSQL + Drizzle ORM |
| Auth | JWT (bcryptjs + jsonwebtoken) |
| AI | OpenAI GPT-4o (chat + TTS) + Whisper (STT) |
| Payments | YooKassa |
| Package manager | pnpm workspaces (monorepo) |

---

## Project structure

```
speaktutor-ai/
├── artifacts/
│   ├── api-server/          # Express 5 backend — all API routes
│   └── speaktutor/          # React + Vite frontend
├── lib/
│   ├── db/                  # Drizzle ORM schema + migrations
│   ├── api-spec/            # OpenAPI 3.1 specification
│   ├── api-zod/             # Generated Zod validation schemas
│   └── api-client-react/    # Generated TanStack Query hooks
├── scripts/                 # Utility scripts
├── pnpm-workspace.yaml      # Workspace config + package catalog
├── tsconfig.base.json       # Shared TypeScript config
└── .env.example             # Required environment variables
```

---

## Prerequisites

- **Node.js** >= 20 (24 recommended)
- **pnpm** >= 9: `npm install -g pnpm`
- **PostgreSQL** >= 14 (or Supabase project)

---

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/speaktutor-ai.git
cd speaktutor-ai
pnpm install
```

### 2. Set environment variables

```bash
cp .env.example .env
# Edit .env and fill in all required values
```

### 3. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

> This uses `drizzle-kit push` to create all tables in your PostgreSQL database.
> Run this every time you change `lib/db/src/schema/`.

### 4. Run locally (two terminals)

**Terminal 1 — API server (port 5000 by default):**
```bash
PORT=5000 pnpm --filter @workspace/api-server run dev
```

**Terminal 2 — Frontend dev server:**
```bash
pnpm --filter @workspace/speaktutor run dev
```

The frontend Vite dev server proxies `/api` requests to `http://localhost:5000`.

Open `http://localhost:5173/speaktutor/` in your browser.

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `OPENAI_API_KEY` | ✅ | OpenAI API key (GPT-4o + Whisper + TTS) |
| `SESSION_SECRET` | ✅ | Random string for JWT signing (min 32 chars) |
| `YOOKASSA_SHOP_ID` | For payments | YooKassa shop ID |
| `YOOKASSA_SECRET_KEY` | For payments | YooKassa secret key |
| `YOOKASSA_RETURN_URL` | For payments | Full URL of your payment return page |
| `SUPABASE_URL` | Optional | Only needed if using Supabase JS client |
| `SUPABASE_ANON_KEY` | Optional | Only needed if using Supabase JS client |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Only needed if using Supabase JS client |

> **Note:** The backend connects to PostgreSQL directly via `DATABASE_URL`. If you use Supabase as your database host, set `DATABASE_URL` to the Supabase **connection pooler URI** (found under Project Settings → Database → Connection pooling).

---

## Building for production

```bash
# Typecheck everything
pnpm run typecheck

# Build the API server (outputs to artifacts/api-server/dist/)
pnpm --filter @workspace/api-server run build

# Build the frontend (outputs to artifacts/speaktutor/dist/)
pnpm --filter @workspace/speaktutor run build
```

---

## Deploying to Render

The project deploys as **two separate Render services**: one for the API and one for the frontend (static site).

### Service 1 — API Server (Web Service)

| Setting | Value |
|---------|-------|
| Environment | Node |
| Build command | `npm install -g pnpm && pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build` |
| Start command | `node artifacts/api-server/dist/index.mjs` |
| Port | `5000` (set `PORT=5000` in env vars) |

**Environment variables to set in Render:**
```
DATABASE_URL=...
OPENAI_API_KEY=...
SESSION_SECRET=...
YOOKASSA_SHOP_ID=...
YOOKASSA_SECRET_KEY=...
YOOKASSA_RETURN_URL=https://your-frontend.onrender.com/speaktutor/payment/return
NODE_ENV=production
PORT=5000
```

### Service 2 — Frontend (Static Site)

| Setting | Value |
|---------|-------|
| Build command | `npm install -g pnpm && pnpm install --frozen-lockfile && pnpm --filter @workspace/speaktutor run build` |
| Publish directory | `artifacts/speaktutor/dist` |

**Important:** After deploying the frontend, go to your static site settings in Render and add a **Redirect/Rewrite rule**:
- Source: `/*`
- Destination: `/index.html`
- Action: **Rewrite** (for SPA routing)

Also set the environment variable in the frontend build:
```
VITE_API_BASE_URL=https://your-api-server.onrender.com
```

> The Vite config reads `VITE_API_BASE_URL` for production API requests.

---

## Connecting Supabase (PostgreSQL host)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → Database → Connection pooling**
3. Copy the **URI** (Transaction mode, port 6543)
4. Set it as `DATABASE_URL` in your `.env` and on Render
5. Run `pnpm --filter @workspace/db run push` to create all tables

Supabase provides PostgreSQL with automatic backups, connection pooling, and a web UI for your data — no configuration beyond the connection string is required for this project.

---

## Connecting YooKassa

1. Register at [yookassa.ru](https://yookassa.ru) and get your shop credentials
2. In your YooKassa dashboard, go to **Integrations → HTTP Notifications**
3. Set the notification URL to:
   ```
   https://your-api-server.onrender.com/api/speaktutor/payment/webhook
   ```
4. Set `YOOKASSA_SHOP_ID` and `YOOKASSA_SECRET_KEY` in your Render environment variables
5. Set `YOOKASSA_RETURN_URL` to:
   ```
   https://your-frontend.onrender.com/speaktutor/payment/return
   ```

### Payment flow

```
User clicks "Купить 5 сессий за 499₽"
  → POST /api/speaktutor/payment/create
  → Redirect to YooKassa confirmation page
  → User completes payment on YooKassa
  → YooKassa calls your webhook: POST /api/speaktutor/payment/webhook
  → Backend marks payment as paid, adds 5 sessions to user account
  → User is redirected to /speaktutor/payment/return?payment_db_id=XXX
  → Success page shows: "Оплата успешно получена. Вам начислено 5 практических сессий."
```

---

## Regenerating API code

If you change the OpenAPI spec (`lib/api-spec/openapi.yaml`), regenerate the Zod schemas and React Query hooks:

```bash
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck:libs
```

---

## Database migrations

After changing any table in `lib/db/src/schema/`:

```bash
# Development (direct push — no migration files)
pnpm --filter @workspace/db run push

# Or generate a SQL migration file first
pnpm --filter @workspace/db run generate
```

---

## Troubleshooting

**`pnpm install` fails with "package too new"**
The workspace has a `minimumReleaseAge: 1440` security setting. Wait 24h after a new package release, or temporarily add the package to `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`.

**"OPENAI_API_KEY environment variable is not set"**
The API server requires this at runtime. Make sure `.env` is present and loaded, or the variable is set in your deployment environment.

**Frontend shows blank page on Render**
Make sure the Static Site has a rewrite rule `/* → /index.html` (Action: Rewrite). Without this, direct URL navigation returns 404.

**Payments not activating after checkout**
YooKassa webhooks require a publicly accessible HTTPS URL. Localhost webhooks won't work. Use your deployed Render URL for the notification endpoint.
