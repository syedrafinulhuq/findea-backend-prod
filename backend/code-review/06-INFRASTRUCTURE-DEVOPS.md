# Infrastructure & DevOps Gaps

---

## INFRA-01 — No Rate Limiting / Throttling

**Severity:** HIGH  
**See also:** SEC-01

`@nestjs/throttler` is not installed. All endpoints — including auth, payments, and order creation — are exposed to unlimited request rates.

**Recommended limits:**

| Route | Limit |
|---|---|
| `POST /auth/login` | 5 req / 60s per IP |
| `POST /auth/register` | 3 req / 60s per IP |
| `POST /auth/forgot-password` | 3 req / 60s per IP |
| `POST /orders` | 10 req / 60s per user/IP |
| All other routes | 100 req / 60s per IP |

---

## INFRA-02 — No Graceful Shutdown

**File:** `src/main.ts`  
**Severity:** MEDIUM

`app.enableShutdownHooks()` is not called. When the process receives `SIGTERM`, it dies immediately — dropping in-flight HTTP requests and potentially abandoning BullMQ jobs mid-execution. This causes data loss in containerized or cloud deployments.

---

## INFRA-03 — No Health Check

**Severity:** MEDIUM

No `/api/health` endpoint. Kubernetes readiness/liveness probes, load balancers, and uptime monitors have nothing to ping. Install `@nestjs/terminus` and expose a health endpoint that checks:
- PostgreSQL connectivity (via Prisma ping)
- Redis connectivity (required by BullMQ)

---

## INFRA-04 — No Environment Variable Validation on Startup

**Severity:** HIGH  
**See also:** SEC-08

If a required env var is missing (e.g., `JWT_ACCESS_SECRET`), the app starts and crashes only when someone first logs in. Use `joi` validation in `ConfigModule` to fail fast at boot time.

---

## INFRA-05 — No Compression Middleware

**Severity:** LOW-MEDIUM

Product list and order list payloads can be large. Without gzip compression, unnecessary bandwidth is consumed. Add `compression` middleware.

---

## INFRA-06 — BullMQ `payment` Queue Has No Worker Process

**Severity:** HIGH  
**See also:** BUG-05

There is a `payment` queue registered and jobs are added to it, but there is no `@Processor('payment')` class. All payment-related background jobs pile up indefinitely in Redis.

---

## INFRA-07 — Dockerfile Does Not Copy `.env.example` or Run Migrations

**File:** `backend/Dockerfile`  
**Severity:** LOW-MEDIUM

The Docker workflow does not run `prisma migrate deploy` before starting. In a fresh deployment, the database has no schema and the app crashes. Add a startup script:

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
```

Or better, run migrations as a separate init container in Docker Compose / Kubernetes.

---

## INFRA-08 — No Logging of Structured Request/Error Context

**Severity:** MEDIUM

Pino is configured for HTTP access logging, but:
- Service-level errors are not logged (see QUAL-06).
- No `requestId` / `correlationId` is injected into logs — impossible to trace a single request through the system.

**Fix:** Use `nestjs-pino`'s `PinoLogger` in services and inject `requestId` via middleware.

---

## INFRA-09 — No Zero-Downtime Deployment Strategy

**Severity:** LOW (production readiness note)

The Dockerfile runs `node dist/src/main.js` directly. In a rolling deployment, old instances are killed before new ones are ready. Without a health check (INFRA-03) and graceful shutdown (INFRA-02), there will be brief downtime on every deploy.

---

## INFRA-10 — No Test Pipeline / CI Configuration

**Severity:** HIGH

There is no `.github/workflows/`, no `Jenkinsfile`, and no test files. Without automated tests and a CI pipeline, every deploy is manual and unverified. At minimum:
1. Add `jest` config to `package.json`
2. Write unit tests for `auth.service`, `orders.service`, `payments.service`
3. Add a GitHub Actions workflow that runs tests on every push
