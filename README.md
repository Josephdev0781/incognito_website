# Backend setup

The existing static frontend is unchanged. This backend requires Node.js 20+ and PostgreSQL.

1. Copy `.env.example` to `.env`, set `DATABASE_URL` and a random `SESSION_SECRET` of at least 32 characters. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the untracked `.env` file to bootstrap the administrator account on first login. In production, Stripe and `FRONTEND_URL` are also required; Daraja variables are required when using M-Pesa.
2. Install dependencies: `npm install`.
3. Create the database and apply the schema: `npm run db:migrate`.
4. Start: `npm start` (development: `npm run dev`).

Authentication endpoints are `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/me`. Orders use `POST/GET /api/orders`. Stripe checkout is `POST /api/payments/stripe/checkout`; Stripe must deliver webhooks to `/api/payments/stripe/webhook`. Daraja callbacks use `/api/payments/mpesa/callback`.

Amounts are integer minor units (for example, cents for USD). Sessions are opaque random cookies; only a keyed SHA-256 hash is stored in PostgreSQL. Do not commit `.env` or provider credentials.
