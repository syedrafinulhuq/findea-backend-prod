# Configuration

All configuration is loaded from environment variables. In development, set these in `backend/.env` (copy from `backend/.env.example`). In production, inject them via Docker Compose or your deployment environment.

Configuration is validated at startup via Joi — the app will refuse to start if required variables are missing or malformed.

---

## Environment Variables

### Server

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | `development` or `production` |
| `PORT` | No | `4000` | HTTP port to listen on |

### Database

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string, e.g. `postgresql://user:pass@host:5432/dbname?schema=public` |

### JWT

| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_ACCESS_SECRET` | **Yes** | — | Secret for signing access tokens. Use 32+ random characters. |
| `JWT_REFRESH_SECRET` | **Yes** | — | Secret for signing refresh tokens. Must differ from access secret. |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Access token lifetime (e.g. `15m`, `1h`) |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token lifetime (e.g. `7d`, `30d`) |

### Redis (BullMQ)

| Variable | Required | Default | Description |
|---|---|---|---|
| `REDIS_HOST` | No | `localhost` | Redis host |
| `REDIS_PORT` | No | `6379` | Redis port |
| `REDIS_PASSWORD` | No | — | Redis password (if any) |

### Email (SMTP)

| Variable | Required | Description |
|---|---|---|
| `SMTP_HOST` | **Yes** | SMTP server host (e.g. `smtp.sendgrid.net`) |
| `SMTP_PORT` | No | SMTP port (default `587`) |
| `SMTP_USER` | **Yes** | SMTP username |
| `SMTP_PASS` | **Yes** | SMTP password |
| `MAIL_FROM` | No | From address (default `"Fidea <no-reply@fidea.com>"`) |

### CORS

| Variable | Required | Default | Description |
|---|---|---|---|
| `CORS_ORIGINS` | No | — | Comma-separated list of allowed origins, e.g. `http://localhost:3000,https://findea.vercel.app` |

### Flutterwave Payments

| Variable | Required | Description |
|---|---|---|
| `FLUTTERWAVE_SECRET_KEY` | **Yes** | Flutterwave secret key (`FLWSECK_TEST_...` or `FLWSECK_LIVE_...`) |
| `FLUTTERWAVE_PUBLIC_KEY` | **Yes** | Flutterwave public key |
| `FLUTTERWAVE_ENCRYPTION_KEY` | **Yes** | Flutterwave encryption key |
| `FLUTTERWAVE_WEBHOOK_HASH` | **Yes** | Webhook verification hash (set in Flutterwave dashboard) |

### Inventory

| Variable | Required | Default | Description |
|---|---|---|---|
| `LOW_STOCK_THRESHOLD` | No | `5` | Products with stock at or below this value trigger a low-stock alert email |

---

## Example `.env`

```env
NODE_ENV=development
PORT=4000

DATABASE_URL=postgresql://postgres:postgres@localhost:5433/findea?schema=public

JWT_ACCESS_SECRET=change-me-use-32-plus-random-chars
JWT_REFRESH_SECRET=change-me-use-different-32-plus-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=yourpassword
MAIL_FROM="Fidea <no-reply@fidea.com>"

CORS_ORIGINS=http://localhost:3000

FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST_xxxx
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_xxxx
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TEST_ENCRYPTION_xxxx
FLUTTERWAVE_WEBHOOK_HASH=your-webhook-hash

LOW_STOCK_THRESHOLD=5
```

---

## Production Notes

- Never commit `.env` to version control.
- Use `docker-compose.prod.yml` which references `${VARIABLE}` syntax and reads from a `.env` file at compose root or from shell environment.
- All secrets (JWT, Flutterwave, SMTP) should be rotated when deploying to production.
- Set `CORS_ORIGINS` to your exact frontend domain(s) — wildcards are not supported.
