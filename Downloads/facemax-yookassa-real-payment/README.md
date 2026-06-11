# FACEMAX — AI Face Analysis
## Build: facemax-yookassa-real-payment

Реальная интеграция ЮKassa. Без демо-режима.

---

## Переменные окружения (Render / любой хостинг)

Добавьте в настройках сервера:

  YOOKASSA_SHOP_ID     — Номер магазина из личного кабинета ЮKassa
  YOOKASSA_SECRET_KEY  — Секретный ключ из личного кабинета ЮKassa

Secret Key используется ТОЛЬКО на бэкенде. Во frontend не попадает.

---

## Структура

  frontend/    — Vite + React (статический сайт)
  api-server/  — Express (Node.js API)

---

## Запуск на Render / VPS

### 1. Backend (api-server)

  cd api-server
  npm install
  npm run build
  PORT=8080 YOOKASSA_SHOP_ID=... YOOKASSA_SECRET_KEY=... node dist/index.mjs

Роуты:
  POST /api/create-payment
  GET  /api/check-payment/:paymentId

### 2. Frontend (static site)

  cd frontend
  npm install
  npm run build   # → dist/

Опубликуйте папку dist/ как Static Site.

В Render: Build Command = "npm install && npm run build"
          Publish Directory = "dist"

---

## Платёжный флоу

1. Пользователь загружает фото и запускает анализ
2. Результаты скрыты — показывается paywall-карточка
3. Нажимает "Разблокировать за 199 ₽"
4. Frontend вызывает POST /api/create-payment
5. Backend создаёт платёж в ЮKassa:
     amount: 199.00 RUB
     description: "FACEMAX AI-анализ лица"
     confirmation.type: "redirect"
     confirmation.return_url: URL сайта
6. Frontend сохраняет paymentId в sessionStorage
7. Пользователь редиректится на страницу ЮKassa
8. После оплаты ЮKassa возвращает на сайт
9. Frontend берёт paymentId, вызывает GET /api/check-payment/:paymentId
10. Если status === "succeeded" → анализ разблокирован
11. Если status !== "succeeded" → показывается "Оплата не завершена."

---

## Проверка

curl -X POST https://YOUR_API_HOST/api/create-payment \
  -H "Content-Type: application/json" \
  -d '{"returnUrl": "https://YOUR_FRONTEND_HOST/"}'

Должен вернуть: {"paymentId":"...","confirmationUrl":"https://yoomoney.ru/..."}

---

## Безопасность

- YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY хранятся ТОЛЬКО на сервере
- В сборку frontend они не попадают
- Все запросы к ЮKassa API идут через backend
