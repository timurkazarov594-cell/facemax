// ─────────────────────────────────────────────────────────────────────────────
// payments.ts — FACEMAX × ЮKassa server-side endpoints
//
// Required env vars:
//   YOOKASSA_SHOP_ID   — ЮKassa номер магазина
//   YOOKASSA_SECRET_KEY — ЮKassa секретный ключ
//
// Endpoints:
//   POST /api/payment/create            → create payment, return confirmation_url
//   GET  /api/payment/status/:paymentId → return current payment status
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { randomUUID } from "crypto";

const router = Router();

const YOOKASSA_API = "https://api.yookassa.ru/v3";

function getAuth(): string {
  const shopId = process.env["YOOKASSA_SHOP_ID"];
  const secretKey = process.env["YOOKASSA_SECRET_KEY"];
  if (!shopId || !secretKey) {
    throw new Error("YOOKASSA_SHOP_ID or YOOKASSA_SECRET_KEY not set");
  }
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`;
}

// ── POST /api/payment/create ───────────────────────────────────────────────────
router.post("/payment/create", async (req, res) => {
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
    `${req.headers["origin"] ?? "https://facemax.app"}/`;

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
      status: string;
      confirmation?: { confirmation_url?: string };
    };

    const confirmation_url = data.confirmation?.confirmation_url;

    // Full diagnostic log — visible in Render / server logs
    req.log.info(
      { paymentId: data.id, status: data.status, confirmation_url },
      "YooKassa payment created",
    );

    if (!confirmation_url) {
      req.log.error({ data }, "YooKassa response missing confirmation_url");
      res.status(502).json({ error: "Не удалось создать ссылку на оплату" });
      return;
    }

    res.json({
      paymentId: data.id,
      confirmation_url,
    });
  } catch (err) {
    req.log.error({ err }, "payment/create unexpected error");
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// ── GET /api/payment/status/:paymentId ────────────────────────────────────────
router.get("/payment/status/:paymentId", async (req, res) => {
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
    req.log.info({ paymentId, status: data.status }, "YooKassa payment status");
    res.json({ status: data.status });
  } catch (err) {
    req.log.error({ err, paymentId }, "payment/status unexpected error");
    res.status(500).json({ status: "failed", error: "Внутренняя ошибка сервера" });
  }
});

export default router;
