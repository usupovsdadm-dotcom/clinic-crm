# Clinic CRM — сервер (NestJS + PostgreSQL + Prisma)

Отдельный продукт, не связан с Консилиумом.

```bash
cp .env.example .env            # заполнить JWT_SECRET, SECRETS_KEY (openssl rand -hex 32)
docker compose up -d db
npm ci
npx prisma migrate dev --name init   # первый раз создаст prisma/migrations
npm run seed                    # admin@demo.ru / demo1234 (также owner@, doctor@)
npm run dev                     # http://localhost:4000/api, /health
npm test
```
Фронтенд: `NEXT_PUBLIC_API_URL=http://localhost:4000 npm run dev` в корне app. Без переменной — демо-режим.

API: `/api/auth/{login,register,me,invite}`, `/api/patients`, `/api/doctors`, `/api/appointments`, `/api/slots`, `/api/templates`, `/api/conversations` (+`/digest`, `/:id/messages`, `/:id/send`, `/:id/assign`), `/api/channels`, `/api/ai/{draft,rewrite}`, `/api/audit` (owner), вебхуки каналов `/webhooks/:channelId`.

Роли: owner (всё + аудит, каналы, приглашения), admin (запись, чаты, шаблоны), doctor (только свои пациенты/записи, телефон замаскирован).
Каналы: Telegram-бот и сообщество ВК реализованы; Макс, WhatsApp (BSP), Telegram-аккаунт (MTProto), SMS — интерфейс есть, ждут доступов.
