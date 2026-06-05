# Infrastructure & DevOps Gaps

---

## ✅ INFRA-01 — No Rate Limiting / Throttling

**Severity:** HIGH
**See also:** SEC-01
**Status: FIXED** — `@nestjs/throttler` installed and registered in `AppModule`. Auth endpoints throttled: login/register at 5 req/60s, forgot-password at 3 req/60s.

---

## ✅ INFRA-02 — No Graceful Shutdown

**File:** `src/main.ts`
**Severity:** MEDIUM
**Status: FIXED** — `app.enableShutdownHooks()` is called before `app.listen()`.

---

## ✅ INFRA-03 — No Health Check

**Severity:** MEDIUM
**Status: FIXED** — `@nestjs/terminus` installed. `GET /api/health` endpoint added at `src/health/`. Checks PostgreSQL connectivity via Prisma ping. Returns `{ status: "ok", info: { database: { status: "up" } } }`.

---

## ✅ INFRA-04 — No Environment Variable Validation on Startup

**Severity:** HIGH
**See also:** SEC-08
**Status: FIXED** — `joi` installed. `ConfigModule.forRoot({ validationSchema: Joi.object({...}) })` validates all required env vars at startup. App refuses to boot with a clear error message if any required variable is missing or malformed.

---

## ✅ INFRA-05 — No Compression Middleware

**Severity:** LOW-MEDIUM
**Status: FIXED** — `compression` package installed. `app.use(compression())` added to `main.ts`. All responses are now gzip-compressed.

---

## ✅ INFRA-06 — BullMQ `payment` Queue Has No Worker Process

**Severity:** HIGH
**See also:** BUG-05
**Status: FIXED** — `src/queue/payment.processor.ts` created with `@Processor('payment')` and registered in `QueueModule`.

---

## ✅ INFRA-07 — Dockerfile Does Not Run Migrations

**File:** `backend/Dockerfile`
**Severity:** LOW-MEDIUM
**Status: FIXED** — `CMD` runs `npx prisma migrate deploy && node dist/src/main.js` so migrations are applied automatically on every container start.

---

## INFRA-08 — No Structured Request/Error Logging

**Severity:** MEDIUM
**Status: OPEN** — Pino HTTP logging is in place but service-level errors are not logged and no `requestId` correlation header is injected.

---

## INFRA-09 — No Zero-Downtime Deployment Strategy

**Severity:** LOW
**Status: OPEN** — Health check (INFRA-03) and graceful shutdown (INFRA-02) are now in place, which are the prerequisites. Rolling deployment config depends on your VPS setup (Nginx, Caddy, or an orchestrator).

---

## INFRA-10 — No Test Pipeline / CI Configuration

**Severity:** HIGH
**Status: OPEN** — No test files or `.github/workflows/` exist. Recommended next step after deployment is stable.
