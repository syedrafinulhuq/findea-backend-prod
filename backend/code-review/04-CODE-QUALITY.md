# Code Quality & Architecture Issues

---

## ✅ QUAL-01 — `any` Types Used Throughout Controllers

**Files:** `src/orders/orders.controller.ts`, `src/users/users.controller.ts`  
**Status: FIXED** — Created `src/common/interfaces/jwt-user.interface.ts` with a `JwtUser` interface (`{ id, email, role }`). All `@CurrentUser() user: any` usages replaced with `@CurrentUser() user: JwtUser`.

```ts
@Get('mine') mine(@CurrentUser() user: any) { ... }
```

Every `CurrentUser()` usage is typed as `any`. This removes type safety from the most critical part of the request cycle.

---

## QUAL-02 — No Custom Exception Filter / No Consistent Error Response Shape

**Severity:** MEDIUM  
**Status: OPEN**

NestJS returns different shapes for different errors:
- `BadRequestException` → `{ statusCode, message, error }`
- Unhandled Prisma errors → 500 with framework stack traces exposed

There is no global exception filter to:
1. Catch `PrismaClientKnownRequestError` (e.g., `P2002` unique constraint) and return a user-friendly message.
2. Normalize all error responses to a single shape.

**Fix:**
```ts
// src/common/filters/prisma-exception.filter.ts
@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    if (exception.code === 'P2002') {
      // unique constraint — return 409 Conflict
    }
    // ...
  }
}
```

---

## QUAL-03 — All DTOs in a Single `dto.ts` File Per Module

**Severity:** LOW (maintainability)  
**Status: OPEN**

Each module puts all its DTOs in one `dto.ts`. As modules grow, this becomes unmanageable.

**Suggested structure:**
```
src/products/dto/
  create-product.dto.ts
  update-product.dto.ts
  product-query.dto.ts
  index.ts
```

---

## QUAL-04 — Hardcoded Magic Values

**Files:** Multiple  
**Status: OPEN**

| Location | Hardcoded Value | Should Be |
|---|---|---|
| `orders.service.ts:22` | `new Prisma.Decimal(80)` delivery fee | Config value / DB-stored shipping rule |
| `auth.service.ts:41` | `1000 * 60 * 10` (10 min OTP TTL) | Config constant |
| `jobs.service.ts:13` | `1000 * 60 * 60 * 24` (24h cutoff) | Config constant |
| `payments.service.ts:10` | `'https://api.flutterwave.com/v3'` | Config value to allow switching between test/live |
| `orders.service.ts:33` | `'Bangladesh'` default country | Config constant |

---

## QUAL-05 — No Response Transformation / Serialization Layer

**Severity:** MEDIUM  
**Status: OPEN**

Raw Prisma query results are returned directly to the client. This means:
- Schema changes immediately affect the API contract.
- Sensitive fields can accidentally be included if a future query forgets `select`.
- Decimal fields from Prisma are returned as strings (e.g., `"price": "89.00"`) which surprises frontend consumers.

**Fix:** Create response DTOs or use `ClassSerializerInterceptor` with `@Expose()` / `@Exclude()`. Add a global response interceptor to transform `Decimal` to `number`.

---

## QUAL-06 — No Global Logging of Errors in Services

**Severity:** MEDIUM  
**Status: OPEN**

Pino is set up in `main.ts` for HTTP request logging, but **service-level errors are never logged**. If `argon2.hash()` or a Prisma query throws unexpectedly, the error is swallowed by NestJS's default handler with no record in your logs.

**Fix:** Inject `Logger` into services or use a global exception filter that logs before responding.

---

## QUAL-07 — Payment `initialize` Is Not Fully Idempotent

**File:** `src/payments/payments.service.ts` line 16  
**Status: OPEN**

```ts
if (order.payment?.checkoutUrl) return order.payment;
```

If a payment record exists but `checkoutUrl` is `null` (e.g., Flutterwave API returned a malformed response), this branch falls through and creates a second Flutterwave charge for the same order. The `upsert` will overwrite `transactionRef` but the old Flutterwave session may still be open.

**Fix:** Return the existing payment if `transactionRef` exists, regardless of `checkoutUrl`. If `checkoutUrl` is missing, expire the old record first.

---

## QUAL-08 — No `@ApiResponse` Decorators on Swagger Endpoints

**Severity:** LOW (developer experience)  
**Status: OPEN**

All controllers use `@ApiTags` and some use `@ApiBearerAuth`, but none define `@ApiResponse({ status: 200, type: ... })`, `@ApiResponse({ status: 401, ... })`, etc. The Swagger docs show no response schemas.

---

## QUAL-09 — Inconsistent Module Structure

**Status: OPEN**

Some modules follow the NestJS convention of one file per concern; others conflate everything:

- `src/auth/dto.ts` — all auth DTOs in one file
- `src/auth/jwt-auth.guard.ts` — guard file is inside `auth/` rather than `common/guards/`
- `src/common/guards/roles.guard.ts` — correct location
- `src/auth/auth.module.ts` — doesn't export `JwtStrategy` so it can't be reused

Standardize: guards go in `common/guards/`, strategies in `common/strategies/`, DTOs in `dto/` subfolder.

---

## ✅ QUAL-10 — `NewsletterService.subscribe` Sends Welcome Email Even for Re-subscribers

**File:** `src/newsletter/newsletter.service.ts`  
**Status: FIXED** — The service now checks for an existing subscriber first. The welcome email is only queued when a new subscriber is created.

```ts
const subscriber = await this.prisma.newsletterSubscriber.upsert({ where: { email }, update: {}, ... });
await this.queue.addEmailJob('newsletter-welcome', { to: dto.email });
```

The `upsert` does nothing if the email already exists (the `update: {}` is a no-op), but the welcome email is sent every time `subscribe` is called. A user can flood their own inbox by calling this endpoint repeatedly.

---

## ✅ QUAL-11 — No Graceful Shutdown

**File:** `src/main.ts`  
**Severity:** MEDIUM (production readiness)  
**Status: FIXED** — `app.enableShutdownHooks()` is now called before `app.listen()`.

`app.enableShutdownHooks()` is not called. On `SIGTERM` (e.g., a Kubernetes pod eviction or Docker `docker stop`), the process is killed immediately — in-flight requests are dropped and BullMQ jobs may be abandoned mid-execution.

---

## QUAL-12 — No Health Check Endpoint

**Severity:** MEDIUM (production readiness)  
**Status: OPEN**

There is no `/api/health` or `/api/health/live` endpoint. Load balancers, container orchestrators, and uptime monitors need a health check to route traffic.

**Fix:** Add `@nestjs/terminus`:
```ts
@Get('health')
@HealthCheck()
check() {
  return this.health.check([
    () => this.prismaHealth.pingCheck('database'),
    () => this.redis.checkHealth('redis', { ...redisOptions }),
  ]);
}
```

---

## QUAL-13 — No Compression Middleware

**Severity:** LOW (performance)  
**Status: OPEN**

Response bodies (especially product lists) are served uncompressed. Add `compression` middleware for gzip:
```ts
import * as compression from 'compression';
app.use(compression());
```

---

## ✅ QUAL-14 — `start` and `start:prod` Point to Different Paths

**File:** `package.json` lines 10–11  
**Status: FIXED** — Both scripts now point to `dist/src/main.js`, consistent with `nest-cli.json`'s `sourceRoot: "src"`.

```json
"start": "node dist/main.js",
"start:prod": "node dist/src/main.js"
```

These are inconsistent — one will fail depending on `tsconfig.json`'s `outDir`.

---

## QUAL-15 — Zero Tests

**Severity:** HIGH (production readiness / maintainability)  
**Status: OPEN**

There are no test files anywhere — no unit tests, no integration tests, no e2e tests. `@nestjs/testing` is in `devDependencies` but never used.

Minimum test coverage needed:
- `auth.service.ts` — register, login, refresh, forgotPassword
- `orders.service.ts` — create (stock check), cancel (status transitions)
- `payments.service.ts` — verify (success/fail paths), handleWebhook
- `jobs.service.ts` — expireOldPendingOrders
