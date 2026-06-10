# Jobs & Queue

Background processing is split between **scheduled cron jobs** (`src/jobs/`) and **async job queues** (`src/queue/`) backed by BullMQ + Redis.

---

## Queue Module

**Location:** `backend/src/queue/`

| File | Purpose |
|---|---|
| `queue.module.ts` | Registers BullMQ queues with Redis connection |
| `queue.service.ts` | Methods to enqueue jobs (`addEmailJob`, `addPaymentJob`) |
| `email.processor.ts` | Consumes the `email` queue |
| `payment.processor.ts` | Consumes the `payment` queue |

### Redis Connection

Configured from environment variables:
```
REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
```

### Email Queue

| Job Name | Triggered By | Payload | Handled? |
|---|---|---|---|
| `welcome` | User registration | `{ to, name }` | Yes |
| `password-reset-otp` | Forgot password | `{ to, otp }` | Yes |
| `order-created` | Order creation | `{ to, orderNumber }` | Yes |
| `newsletter-welcome` | Newsletter subscribe | `{ to }` | Yes |
| `low-stock-alert` | Hourly cron | `{ productId, productName, stock }` | **No — queued but not handled** |

**Retry policy:** 3 attempts, exponential backoff starting at 5s.

`EmailProcessor` (`@Processor('email')`) sends each email via `MailService` (Nodemailer/SMTP) based on `job.name`. It also has a dormant handler for a `password-reset` job name that nothing currently enqueues (legacy from before the OTP flow).

> `low-stock-alert` jobs are enqueued by the cron job below but have **no case in `EmailProcessor`** — they complete silently without sending an email. This is a known gap if email alerts to admins are required.

### Payment Queue

| Job Name | Triggered By | Payload |
|---|---|---|
| `payment-success` | Successful Flutterwave verification | `{ paymentId, orderId }` |

**Retry policy:** 5 attempts, exponential backoff starting at 10s.

`PaymentProcessor` (`@Processor('payment')`) currently only logs the event — it's a placeholder for future side effects (loyalty points, inventory alerts, accounting sync, etc.).

### Why a Queue?

- Decouples slow operations (SMTP calls, third-party APIs) from the request/response cycle.
- Provides automatic retries with backoff for transient failures.
- Keeps `OrdersService`, `AuthService`, etc. fast and synchronous from the client's perspective.

---

## Jobs Module (Cron)

**Location:** `backend/src/jobs/`

| File | Purpose |
|---|---|
| `jobs.service.ts` | Cron job definitions |
| `jobs.module.ts` | Module definition |

Uses `@nestjs/schedule` with `@Cron()` decorators.

### 1. Expire Old Pending Orders

```typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async expireOldPendingOrders()
```

- Bulk-updates all `Order` rows with `status = PENDING` and `createdAt` older than 24 hours.
- Sets `status = CANCELLED` and `cancelReason = 'Auto-cancelled after 24 hours without payment.'`.
- **Does not restore `product.stock`** — stock decremented at order creation is not returned to inventory by this job.

### 2. Check Low Stock

```typescript
@Cron(CronExpression.EVERY_HOUR)
async checkLowStock()
```

- Finds active products where `stock <= LOW_STOCK_THRESHOLD` (env var, default `5`) and `lowStockAlert = false`.
- For each one: queues a `low-stock-alert` email job (see caveat above) and sets `lowStockAlert = true` so it isn't re-queued every hour.
- Separately, resets `lowStockAlert = false` for any product whose `stock` has risen back above the threshold, so future drops trigger a new alert.

---

## Operational Notes

- Both Redis connectivity and the cron scheduler start automatically with the app — no separate worker process is required (BullMQ processors run in-process).
- If Redis is unavailable at startup, the app will fail to start (Joi-validated config requires `REDIS_HOST`/`REDIS_PORT` to be reachable for BullMQ registration).
- Logs for job execution and cron runs are emitted via Pino (`Logger` service) and visible in `docker compose logs -f app`.
