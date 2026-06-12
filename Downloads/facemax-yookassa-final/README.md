# FACEMAX — AI Face Analysis

AI-анализ внешности с оплатой через ЮKassa.
Express Web Service: один сервер отдаёт фронтенд и обрабатывает платежи.

---

## Деплой на Render (Web Service)

**Build Command:**  `npm install && npm run build`
**Start Command:**  `npm start`
**Runtime:**        Node

### Переменные окружения (Environment):

| Переменная            | Описание                           |
|-----------------------|------------------------------------|
| `YOOKASSA_SHOP_ID`    | Номер магазина из кабинета ЮKassa  |
| `YOOKASSA_SECRET_KEY` | Секретный ключ из кабинета ЮKassa  |

---

## API Endpoints

### POST /api/create-payment
Создаёт платёж 199 ₽ в ЮKassa.
```json
Request:  { "returnUrl": "https://your-app.onrender.com/" }
Response: { "paymentId": "...", "confirmationUrl": "https://yoomoney.ru/..." }
```

### GET /api/check-payment/:id
Проверяет статус платежа.
```json
Response: { "status": "succeeded" }
```
Статусы: `pending` | `waiting_for_capture` | `succeeded` | `failed` | `cancelled`

---

## Платёжный флоу

1. Открытие → выбор пола/возраста
2. Загрузка фото анфас + профиль
3. Кнопка «Анализировать»
4. Анализ выполняется локально (без сети)
5. Результаты скрыты → paywall-карточка
6. Кнопка «Разблокировать за 199 ₽»
7. POST /api/create-payment → получение confirmationUrl
8. Редирект на страницу оплаты ЮKassa
9. Пользователь оплачивает
10. ЮKassa возвращает на сайт
11. GET /api/check-payment/:id каждые 5 сек
12. status === "succeeded" → полный результат открыт

**Демо-режима нет. Только реальная оплата.**

---

## Локальный запуск

```bash
cp .env.example .env
# Заполните .env тестовыми ключами ЮKassa
npm install
npm run build
npm start
# → http://localhost:3000
```
