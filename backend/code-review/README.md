# Backend Code Review — Findea E-Commerce API

**Reviewed:** 2026-06-04  
**Stack:** NestJS · PostgreSQL · Prisma · BullMQ · Flutterwave · Argon2 · Pino  
**Scope:** Full backend at `findea/backend/`

---

## Documents in This Folder

| File | What It Covers |
|---|---|
| [01-CRITICAL-BUGS.md](./01-CRITICAL-BUGS.md) | Bugs causing data corruption, security holes, or silent failures |
| [02-MISSING-ECOMMERCE-FEATURES.md](./02-MISSING-ECOMMERCE-FEATURES.md) | Standard e-commerce features that are entirely absent |
| [03-SECURITY-ISSUES.md](./03-SECURITY-ISSUES.md) | Security vulnerabilities beyond the critical bugs |
| [04-CODE-QUALITY.md](./04-CODE-QUALITY.md) | Maintainability, type safety, architecture issues |
| [05-DATABASE-SCHEMA-GAPS.md](./05-DATABASE-SCHEMA-GAPS.md) | Schema design problems and missing models |
| [06-INFRASTRUCTURE-DEVOPS.md](./06-INFRASTRUCTURE-DEVOPS.md) | Production readiness: health checks, CI, shutdown, etc. |
| [07-IMPROVEMENT-ROADMAP.md](./07-IMPROVEMENT-ROADMAP.md) | Prioritized phase-by-phase fix plan |

---

## Top 10 Immediate Priorities

1. **Stock never decrements** — you can sell unlimited units of any product (BUG-01)
2. **Payment success worker is missing** — all `payment-success` queue jobs are silently dropped (BUG-05)
3. **Duplicate CORS call** — `origin: true` accepts any domain (BUG-03)
4. **OTP uses `Math.random()`** — cryptographically weak, can be predicted (BUG-07)
5. **`forgotPassword` leaks which emails are registered** — user enumeration (BUG-06)
6. **No rate limiting** — auth endpoints are open to brute force (SEC-01)
7. **No logout endpoint** — stolen refresh tokens are valid for 7 days with no revocation (BUG-10)
8. **No env var validation** — missing secrets only fail at first user request, not at startup (SEC-08)
9. **`OrderItem` doesn't snapshot product name** — order history breaks if products are renamed (DB-03)
10. **No pagination** — list endpoints will load entire tables at scale (FEAT-07)

---

## What Is Already Good

- Argon2 for password hashing — correct choice over bcrypt
- Refresh token rotation with hash storage — solid design
- BullMQ queue for emails and payments — correct async architecture
- Pino structured logging — production-ready logging foundation
- Helmet, CORS, ValidationPipe with `whitelist: true` — good baseline security posture
- Prisma with proper `Decimal` types for money — avoids floating-point errors
- OTP-based password reset — better UX than email links
- Cron job for auto-cancelling stale orders — thoughtful feature
- Swagger setup with Bearer auth — good developer experience
- Docker + docker-compose setup present
