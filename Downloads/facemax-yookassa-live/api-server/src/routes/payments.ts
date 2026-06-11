// ─────────────────────────────────────────────────────────────────────────────
// payments.ts — FACEMAX × ЮKassa server-side endpoints
//
// Required env vars (set in Replit Secrets or .env):
//   SHOP_ID     — ЮKassa shop ID (номер магазина)
//   SECRET_KEY  — ЮKassa secret key (секретный ключ)
//
// Endpoints:
//   POST /api/payments/create       → create YooKassa payment, return confirmationUrl
//   GET  /api/payments/:id/status   → return current payment status
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { randomUUID } from "crypto";

const router = Router();

const YOOKASSA_API = "https://api.yookassa.ru/v3";

function getAuth(): string {
  const shopId = process.env["SHOP_ID"];
  const secretKey = process.env["SECRET_KEY"];
  if (!shopId || !secretKey) {
    throw new Error("SHOP_ID or SECRET_KEY environment variable is not set");
  }
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`;
}

// ── POST /api/payments/create ─────────────────────────────────────────────────
router.post("/payments/create", async (req, res) => {
  let auth: string;
  try {
    auth = getAuth();
  } catch {
    req.log.warn("YooKassa credentials not configured");
    res.status(503).json({ error: "Payment not configured" });
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
        description: "FACEMAX Premium AI Analysis",
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      req.log.error({ status: resp.status, body }, "YooKassa payment creation failed");
      res.status(502).json({ error: "Payment gateway error" });
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
    req.log.error({ err }, "payments/create unexpected error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/payments/:id/status ──────────────────────────────────────────────
router.get("/payments/:id/status", async (req, res) => {
  let auth: string;
  try {
    auth = getAuth();
  } catch {
    res.status(503).json({ status: "failed", error: "Payment not configured" });
    return;
  }

  const { id } = req.params as { id: string };

  try {
    const resp = await fetch(`${YOOKASSA_API}/payments/${id}`, {
      headers: { Authorization: auth },
    });

    if (!resp.ok) {
      req.log.error({ status: resp.status, id }, "YooKassa status check failed");
      res.status(502).json({ status: "failed", error: "Payment gateway error" });
      return;
    }

    const data = (await resp.json()) as { status: string };
    res.json({ status: data.status });
  } catch (err) {
    req.log.error({ err, id }, "payments/status unexpected error");
    res.status(500).json({ status: "failed", error: "Internal server error" });
  }
});

export default router;
