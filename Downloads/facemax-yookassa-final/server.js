import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

// ── POST /api/payment/create ──────────────────────────────────────────────────
app.post('/api/payment/create', async (req, res) => {
  const shopId    = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    console.error('[FACEMAX] YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY not set');
    return res.status(503).json({ error: 'Платёжный сервис не настроен' });
  }

  const returnUrl = (req.body && req.body.returnUrl)
    || `${req.headers.origin || 'https://your-app.onrender.com'}/`;

  const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

  try {
    const resp = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'Idempotence-Key': randomUUID(),
        'Authorization':   `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount:       { value: '199.00', currency: 'RUB' },
        confirmation: { type: 'redirect', return_url: returnUrl },
        capture:      true,
        description:  'FACEMAX AI-анализ лица',
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('[FACEMAX] YooKassa error:', resp.status, text);
      return res.status(502).json({ error: 'Ошибка платёжного шлюза' });
    }

    const data = await resp.json();

    const confirmation_url = data?.confirmation?.confirmation_url;

    // Diagnostic log — visible in Render logs
    console.log('[FACEMAX] YooKassa payment created:', {
      paymentId:        data.id,
      status:           data.status,
      confirmation_url: confirmation_url ?? '(missing!)',
    });

    if (!confirmation_url) {
      console.error('[FACEMAX] confirmation_url absent:', JSON.stringify(data));
      return res.status(502).json({ error: 'Не удалось создать ссылку на оплату' });
    }

    res.json({ paymentId: data.id, confirmation_url });
  } catch (err) {
    console.error('[FACEMAX] payment/create exception:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ── GET /api/payment/status/:id ───────────────────────────────────────────────
app.get('/api/payment/status/:id', async (req, res) => {
  const shopId    = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    return res.status(503).json({ status: 'failed', error: 'Платёжный сервис не настроен' });
  }

  const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

  try {
    const resp = await fetch(`https://api.yookassa.ru/v3/payments/${req.params.id}`, {
      headers: { 'Authorization': `Basic ${auth}` },
    });

    if (!resp.ok) {
      console.error('[FACEMAX] status check error:', resp.status, 'id:', req.params.id);
      return res.status(502).json({ status: 'failed', error: 'Ошибка платёжного шлюза' });
    }

    const data = await resp.json();
    console.log('[FACEMAX] payment status:', req.params.id, '->', data.status);
    res.json({ status: data.status });
  } catch (err) {
    console.error('[FACEMAX] payment/status exception:', err);
    res.status(500).json({ status: 'failed', error: 'Внутренняя ошибка сервера' });
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/healthz', (_req, res) => res.json({ ok: true }));

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[FACEMAX] Server running on port ${PORT}`);
  console.log(`[FACEMAX] YooKassa shop: ${process.env.YOOKASSA_SHOP_ID ? 'configured ✓' : 'NOT SET ✗'}`);
});
