# Voyage — AI Travel Concierge

A full-stack AI travel planning app. The Express backend handles `/api/*` routes and serves the React frontend as static files from `dist/public/`.

---

## Deploy on Render

### 1. Create a Web Service

Go to [render.com](https://render.com) → New → **Web Service** → connect your GitHub repository.

| Setting | Value |
|---|---|
| Environment | **Node** |
| Build Command | `npm install && npm run build` |
| Start Command | `npm run start` |

### 2. Set Environment Variables

In Render's **Environment** tab, add:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `OPENAI_BASE_URL` | *(optional)* Custom OpenAI-compatible endpoint |
| `SESSION_SECRET` | A long random string (e.g. `openssl rand -hex 32`) |

> **Do NOT set `PORT`** — Render injects it automatically.

### 3. Deploy

Click **Create Web Service**. Render will:
1. Run `npm install` to install all dependencies
2. Run `npm run build` which builds the React frontend (`vite build`) and compiles the Express server (`node build-server.mjs`) into `dist/`
3. Start the app with `npm run start` (`node dist/index.mjs`)

---

## Important Notes

### Data Storage (Ephemeral Filesystem)

User accounts and route cache are stored in `data/users.json` and `data/route-cache.json` on disk. On Render's free tier, **the filesystem resets on every redeploy**, meaning all user accounts are lost.

To fix this for production:
- Use **Render Disks** (persistent volume) — mount at `/data` and set `DATA_DIR=/data` as an env var
- Or migrate user storage to a database (PostgreSQL, MongoDB, etc.)

### Local Development

```bash
npm install
# For dev with hot reload (frontend only at http://localhost:3000):
npx vite

# For dev with both frontend + backend:
npm run dev
```

Set up a `.env` file locally:
```
OPENAI_API_KEY=sk-...
SESSION_SECRET=local-dev-secret
NODE_ENV=development
PORT=3000
```

---

## Project Structure

```
├── src/              React frontend source
├── public/           Static assets (favicon, images)
├── server/           Express backend TypeScript source
│   ├── index.ts      Entry point — starts HTTP server + serves dist/public/
│   ├── app.ts        Express app setup (session, cors, routes)
│   ├── routes/
│   │   ├── auth.ts   Login, register, logout, /me
│   │   ├── voyage.ts AI trip planning, hotel image lookup, saved trips
│   │   └── health.ts GET /api/healthz
│   └── lib/
│       ├── user-store.ts   File-based user store (data/users.json)
│       ├── route-cache.ts  AI response cache (data/route-cache.json)
│       └── hotel-images.ts Verified hotel photo database
├── data/             Runtime data dir — gitignored in production
├── index.html        Vite HTML entry point
├── vite.config.ts    Vite config (no Replit plugins)
├── build-server.mjs  esbuild script for server TypeScript compilation
└── package.json      All dependencies (no workspace: or catalog: refs)
```

---

## Files to Push to GitHub

Push everything **except** `node_modules/`, `dist/`, and `data/*.json`:

```bash
git init
git add .
git commit -m "Initial Voyage deployment"
git remote add origin https://github.com/YOUR_USER/voyage.git
git push -u origin main
```

The `.gitignore` already excludes `node_modules/`, `dist/`, and `data/users.json` / `data/route-cache.json`.
