# FACEMAX — AI Face Analysis
## Build: facemax-real-yookassa-fixed
## Без демо-режима. Только реальная оплата.

---

## Переменные окружения (Render)

Добавить в Dashboard → Environment:

  YOOKASSA_SHOP_ID     — Номер магазина из личного кабинета ЮKassa
  YOOKASSA_SECRET_KEY  — Секретный ключ из личного кабинета ЮKassa

Secret Key используется ТОЛЬКО на бэкенде. В frontend не попадает никогда.

---

## Структура ZIP

  frontend/   — Vite + React (статический сайт)
  api-server/ — Express API (Node.js)

---

## Деплой на Render

### Backend (api-server) — Web Service

  Root Directory:  api-server
  Build Command:   npm install && npm run build
  Start Command:   npm start
  Environment:     YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY

API endpoints:
  POST /api/create-payment            → создать платёж ЮKassa
  GET  /api/check-payment/:paymentId  → проверить статус платежа

### Frontend — Static Site

  Root Directory:  frontend
  Build Command:   npm install && npm run build
  Publish Dir:     dist

В настройках фронтенда указать URL бэкенда если они на разных доменах.

---

## Платёжный флоу (строго)

1. Пользователь открывает сайт → видит выбор пола/возраста
2. Загружает фото анфас и профиль
3. Нажимает "Анализировать"
4. Анализ выполняется (локально, без сети)
5. Результаты СКРЫТЫ — показывается paywall-карточка:
   "Разблокировать полный отчёт — 199 ₽"
6. Нажимает кнопку → frontend вызывает POST /api/create-payment
7. Backend создаёт платёж в ЮKassa:
     amount:      199.00 RUB
     description: "FACEMAX AI-анализ лица"
     capture:     true
     return_url:  URL сайта
8. Frontend сохраняет paymentId в sessionStorage
9. Frontend делает window.location.href = confirmation_url
10. Пользователь оплачивает на странице ЮKassa
11. ЮKassa возвращает пользователя на сайт
12. Frontend читает paymentId из sessionStorage
13. Frontend вызывает GET /api/check-payment/:paymentId каждые 5 секунд
14. Если status === "succeeded" → полный результат открывается
15. Если status === "failed" / "cancelled" → показывается "Оплата не завершена."
16. Демо-режима нет. Обхода нет. Только реальная оплата.

---

## Проверка бэкенда

curl -X POST https://YOUR_API/api/create-payment \
  -H "Content-Type: application/json" \
  -d '{"returnUrl":"https://YOUR_FRONTEND/"}'

Ожидаемый ответ:
  {"paymentId":"...","confirmationUrl":"https://yoomoney.ru/checkout/payments/v2/..."}

---

## Безопасность

- YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY — только на сервере
- В сборку frontend не попадают
- Все запросы к api.yookassa.ru — через backend
- Frontend не знает о секретных ключах
