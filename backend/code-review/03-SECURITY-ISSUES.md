# Security Issues

---

## SEC-01 — No Rate Limiting on Auth Endpoints

**File:** `src/main.ts`, `src/auth/`  
**Severity:** HIGH — brute force / credential stuffing  
**Status: OPEN** — Requires installing `@nestjs/throttler`.

There is no rate limiter anywhere. The `POST /auth/login`, `POST /auth/register`, and `POST /auth/forgot-password` endpoints can be called thousands of times per second with no throttling.

**Fix:** Install `@nestjs/throttler` and apply a tight limit to auth routes:

```ts
// app.module.ts
ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }])

// auth.controller.ts
@UseGuards(ThrottlerGuard)
@Throttle({ default: { ttl: 60_000, limit: 5 } })
@Post('login') login(...)
```

---

## ✅ SEC-02 — CORS `origin: true` Remnant

**File:** `src/main.ts` line 12  
**See also:** BUG-03  
**Status: FIXED** — The `enableCors({ origin: true })` call has been removed. Only the correct origin allow-list config remains.

`origin: true` means "echo back whatever the request's Origin header is" — i.e., every domain is allowed. Even though the second `enableCors` call overrides it, this line must be deleted to avoid future accidents.

---

## ✅ SEC-03 — No Helmet CSP / Swagger Conflict

**File:** `src/main.ts` line 11  
**Severity:** LOW-MEDIUM  
**Status: FIXED** — Helmet is now configured with `contentSecurityPolicy: false` in development and default (strict) CSP in production.

`app.use(helmet())` with default settings sets a strict `Content-Security-Policy` that blocks Swagger UI's inline scripts. Either configure Helmet to allow Swagger in non-production, or use:

```ts
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  }),
);
```

---

## SEC-04 — Sensitive Fields Potentially Exposed in API Responses

**File:** Multiple services  
**Severity:** MEDIUM  
**Status: OPEN**

`UsersService.me()` correctly uses `select` to omit `passwordHash`, `refreshTokenHash`, and `passwordResetToken`. But other parts of the codebase that return `User` objects (e.g., `auth.service.ts` → `issueTokens` only returns `{ id, email, role }` which is fine) — however `OrdersService.all()` returns raw order data, and future code could accidentally return user relations with sensitive fields.

**Fix:** Add a global `ClassSerializerInterceptor` and use `@Exclude()` on the `User` class, or create consistent response DTOs / `select` projections in every service.

---

## ✅ SEC-05 — Webhook Signature Comparison Is Not Constant-Time

**File:** `src/payments/payments.service.ts` line 51  
**Severity:** LOW (timing side channel on webhook secret)  
**Status: FIXED** — Signature is now compared with `timingSafeEqual` from `crypto`.

```ts
if (secretHash && signature !== secretHash) throw ...
```

JavaScript `!==` short-circuits on the first differing character, creating a tiny timing leak.

---

## SEC-06 — No Input Sanitization for HTML/XSS

**File:** All DTOs  
**Severity:** MEDIUM  
**Status: OPEN**

`class-validator` validates types and formats but does not strip or escape HTML. A `customerName` of `<script>alert(1)</script>` will be stored as-is. If any part of the system renders these values in HTML emails or an admin panel, XSS is possible.

**Fix:** Add `@Transform(({ value }) => sanitizeHtml(value))` on free-text string fields, or use `sanitize-html` / `xss` at the service level.

---

## SEC-07 — No HTTPS / TLS Enforcement in Config

**Severity:** MEDIUM (production readiness)  
**Status: OPEN**

The `.env.example` sets `FRONTEND_URL=http://localhost:3000`. In production, redirect URLs sent to Flutterwave must use HTTPS. If `FRONTEND_URL` is accidentally set to HTTP in production, payment callbacks will be sent over plain HTTP.

**Fix:** Add env validation with `joi` or `zod` that enforces `HTTPS` for `FRONTEND_URL` when `NODE_ENV=production`.

---

## SEC-08 — No Environment Variable Validation on Startup

**File:** `src/app.module.ts`  
**Severity:** MEDIUM  
**Status: OPEN** — Requires installing `joi`.

`ConfigModule.forRoot({ isGlobal: true })` loads `.env` but does not validate that required variables are present. If `JWT_ACCESS_SECRET` is missing, the app starts silently and then crashes at runtime when a user logs in.

**Fix:**
```ts
import * as Joi from 'joi';

ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: Joi.object({
    DATABASE_URL: Joi.string().required(),
    JWT_ACCESS_SECRET: Joi.string().min(32).required(),
    JWT_REFRESH_SECRET: Joi.string().min(32).required(),
    FLUTTERWAVE_SECRET_KEY: Joi.string().required(),
    FLUTTERWAVE_WEBHOOK_HASH: Joi.string().required(),
    FRONTEND_URL: Joi.string().uri().required(),
  }),
}),
```

---

## ✅ SEC-09 — `track` Endpoint Exposes Order Details Without Authentication

**File:** `src/orders/orders.controller.ts` line 15  
**Severity:** MEDIUM  
**Status: FIXED** — The `email` query param is now required (non-optional). An order can only be looked up when both the order number and customer email match.

```ts
@Get('track/:orderNumber') track(@Param('orderNumber') orderNumber: string, @Query('email') email?: string)
```

The `email` query param is **optional**. If omitted, the service does `customerEmail: undefined` which Prisma ignores — so any order can be fully looked up by order number alone. Order numbers follow a predictable `FID-<timestamp>` pattern.
