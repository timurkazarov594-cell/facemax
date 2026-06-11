// ─────────────────────────────────────────────────────────────────────────────
// payments.ts — FACEMAX × ЮKassa server-side endpoints
//
// Required env vars (Render / Replit Secrets):
//   YOOKASSA_SHOP_ID   — ЮKassa номер магазина
//   YOOKASSA_SECRET_KEY — ЮKassa секретный ключ
//
// Endpoints:
//   POST /api/create-payment        → create YooKassa payment, return confirmationUrl
//   GET  /api/check-payment/:paymentId → return current payment status
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { randomUUID } from "crypto";

const router = Router();

const YOOKASSA_API = "https://api.yookassa.ru/v3";

function getAuth(): string {
  const shopId = process.env["YOOKASSA_SHOP_ID"];
  const secretKey = process.env["YOOKASSA_SECRET_KEY"];
  if (!shopId || !secretKey) {
    throw new Error("YOOKASSA_SHOP_ID or YOOKASSA_SECRET_KEY environment variable is not set");
  }
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`;
}

// ── POST /api/create-payment ───────────────────────────────────────────────────
router.post("/create-payment", async (req, res) => {
  let auth: string;
  try {
    auth = getAuth();
  } catch {
    req.log.warn("YooKassa credentials not configured");
    res.status(503).json({ error: "Платёжный сервис не настроен" });
    return;
  }

  const returnUrl =
    (req.body as { returnUrl?: string }).returnUrl ??
    `${req.headers["origin"] ?? "https://facemax.app"}/lookmax/`;

  try {
    const resp = await fetch(`${YOOKASSA_API}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": randomUUID(),
        Authorization: auth,
      },
      body: JSON.stringify({
        amount: { value: "199.00", currency: "RUB" },
        confirmation: { type: "redirect", return_url: returnUrl },
        capture: true,
        description: "FACEMAX AI-анализ лица",
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      req.log.error({ status: resp.status, body }, "YooKassa payment creation failed");
      res.status(502).json({ error: "Ошибка платёжного шлюза" });
      return;
    }

    const data = (await resp.json()) as {
      id: string;
      confirmation: { confirmation_url: string };
    };

    res.json({
      paymentId: data.id,
      confirmationUrl: data.confirmation.confirmation_url,
    });
  } catch (err) {
    req.log.error({ err }, "create-payment unexpected error");
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// ── GET /api/check-payment/:paymentId ─────────────────────────────────────────
router.get("/check-payment/:paymentId", async (req, res) => {
  let auth: string;
  try {
    auth = getAuth();
  } catch {
    res.status(503).json({ status: "failed", error: "Платёжный сервис не настроен" });
    return;
  }

  const { paymentId } = req.params as { paymentId: string };

  try {
    const resp = await fetch(`${YOOKASSA_API}/payments/${paymentId}`, {
      headers: { Authorization: auth },
    });

    if (!resp.ok) {
      req.log.error({ status: resp.status, paymentId }, "YooKassa status check failed");
      res.status(502).json({ status: "failed", error: "Ошибка платёжного шлюза" });
      return;
    }

    const data = (await resp.json()) as { status: string };
    res.json({ status: data.status });
  } catch (err) {
    req.log.error({ err, paymentId }, "check-payment unexpected error");
    res.status(500).json({ status: "failed", error: "Внутренняя ошибка сервера" });
  }
});

export default router;
