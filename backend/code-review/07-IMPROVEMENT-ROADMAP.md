# Improvement Roadmap

Prioritized implementation plan. Fix in this order.

---

## Phase 1 — Critical Fixes (Before Any Production Traffic)

| # | Task | Reference | Status |
|---|---|---|---|
| 1 | Fix stock not being decremented on order create | BUG-01 | ✅ Done |
| 2 | Wrap order creation in a Prisma transaction | BUG-04 | ✅ Done |
| 3 | Remove the first `enableCors({ origin: true })` call | BUG-03 | ✅ Done |
| 4 | Add `app.enableShutdownHooks()` | QUAL-11 | ✅ Done |
| 5 | Fix OTP to use `crypto.randomInt` | BUG-07 | ✅ Done |
| 6 | Fix `forgotPassword` to not reveal account existence | BUG-06 | ✅ Done |
| 7 | Fix order number collision with random suffix | BUG-02 | ✅ Done |
| 8 | Add `@Processor('payment')` worker | BUG-05 | ✅ Done |
| 9 | Add `POST /auth/logout` | BUG-10 | ✅ Done |
| 10 | Validate env vars at startup with `joi` | SEC-08, INFRA-04 | ✅ Done |
| 11 | Add rate limiting with `@nestjs/throttler` | SEC-01 | ✅ Done |
| 12 | Add `productName` snapshot to `OrderItem` | DB-03 | ✅ Done |

---

## Phase 2 — Essential Missing Features (Core E-Commerce)

| # | Task | Reference | Status |
|---|---|---|---|
| 1 | Admin: update order status (`PROCESSING → SHIPPED → DELIVERED`) | FEAT-04 | ✅ Done |
| 2 | Admin: update / soft-delete products | FEAT-05 | ✅ Done |
| 3 | Admin: create / update / delete categories | FEAT-05 | ✅ Done (create only) |
| 4 | Add pagination to all list endpoints | FEAT-07 | ✅ Done |
| 5 | Address CRUD endpoints for users | FEAT-06 | ✅ Done |
| 6 | Add product sorting (price, newest, popular) | FEAT-14 | ✅ Done |
| 7 | Fix `track` endpoint to require email | SEC-09 | ✅ Done |
| 8 | Add `POST /auth/logout` | BUG-10 | ✅ Done |
| 9 | Add DB indexes for frequent query columns | DB-01 | ✅ Done |
| 10 | Add soft delete to `Product` | DB-02 | ✅ Done (via `isActive`) |

---

## Phase 3 — Product Catalog Improvements

| # | Task | Reference | Status |
|---|---|---|---|
| 1 | Product variants (size / color / SKU) | FEAT-02 | ⏳ Deferred (major refactor) |
| 2 | Product image gallery | FEAT-03 | ✅ Done |
| 3 | Product review & rating system | FEAT-09 | ✅ Done |
| 4 | Low-stock alerts via BullMQ job | FEAT-15 | ✅ Done |

---

## Phase 4 — Customer Experience Features

| # | Task | Reference | Status |
|---|---|---|---|
| 1 | Cart system (server-side) | FEAT-01 | ✅ Done |
| 2 | Wishlist | FEAT-10 | ✅ Done |
| 3 | Coupon / discount system | FEAT-08, DB-08 | ✅ Done |
| 4 | Refund flow | FEAT-11 | ✅ Done |
| 5 | Newsletter unsubscribe endpoint + token | DB-11 | ✅ Done |

---

## Phase 5 — Admin & Analytics

| # | Task | Reference | Status |
|---|---|---|---|
| 1 | Admin dashboard stats endpoint | FEAT-12 | ✅ Done |
| 2 | Admin user management (list, ban, change role) | n/a | ⏳ Open |
| 3 | Shipping tracking number on orders | FEAT-13 | ✅ Done |
| 4 | DB-stored shipping rules (dynamic delivery fee) | DB-07 | ⏳ Open |

---

## Phase 6 — Code Quality & Observability

| # | Task | Reference | Status |
|---|---|---|---|
| 1 | Replace `user: any` with `JwtUser` interface | QUAL-01 | ✅ Done |
| 2 | Add global Prisma exception filter | QUAL-02 | ⏳ Open |
| 3 | Add response DTOs / serialization layer | QUAL-05 | ⏳ Open |
| 4 | Add `@nestjs/terminus` health check | QUAL-12, INFRA-03 | ✅ Done |
| 5 | Add `compression` middleware | QUAL-13, INFRA-05 | ✅ Done |
| 6 | Add structured error logging in services | QUAL-06 | ⏳ Open |
| 7 | Add `@ApiResponse` decorators to Swagger | QUAL-08 | ⏳ Open |
| 8 | Organize DTOs into subfolders | QUAL-03 | ⏳ Open |
| 9 | Move constants/magic values to config | QUAL-04 | ⏳ Open |
| 10 | Add `timingSafeEqual` to webhook check | SEC-05 | ✅ Done |
| 11 | CORS origins from env var | — | ✅ Done |

---

## Phase 7 — Testing & CI/CD

| # | Task | Reference | Status |
|---|---|---|---|
| 1 | Unit tests: `auth.service`, `orders.service`, `payments.service` | QUAL-15 | ⏳ Open |
| 2 | Integration tests with a test DB | QUAL-15 | ⏳ Open |
| 3 | E2E tests for critical flows (register → order → pay) | QUAL-15 | ⏳ Open |
| 4 | GitHub Actions CI: lint + test on PR | INFRA-10 | ⏳ Open |
| 5 | Add Dockerfile migration step | INFRA-07 | ✅ Done |

---

## Summary

| Phase | Total | Done | Open |
|---|---|---|---|
| Phase 1 — Critical Fixes | 12 | **12** | 0 |
| Phase 2 — Essential Features | 10 | **10** | 0 |
| Phase 3 — Product Catalog | 4 | **3** | 1 (variants) |
| Phase 4 — Customer Experience | 5 | **5** | 0 |
| Phase 5 — Admin & Analytics | 4 | **3** | 1 |
| Phase 6 — Code Quality | 11 | **6** | 5 |
| Phase 7 — Testing & CI/CD | 5 | **1** | 4 |
| **Total** | **51** | **40** | **11** |
