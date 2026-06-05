# Improvement Roadmap

Prioritized implementation plan. Fix in this order.

---

## Phase 1 — Critical Fixes (Before Any Production Traffic)

These are bugs or security holes that cause data corruption, security vulnerabilities, or silent failures right now.

| # | Task | Reference |
|---|---|---|
| 1 | Fix stock not being decremented on order create | BUG-01 |
| 2 | Wrap order creation in a Prisma transaction | BUG-04 |
| 3 | Remove the first `enableCors({ origin: true })` call | BUG-03 |
| 4 | Add `app.enableShutdownHooks()` | QUAL-11 |
| 5 | Fix OTP to use `crypto.randomInt` | BUG-07 |
| 6 | Fix `forgotPassword` to not reveal account existence | BUG-06 |
| 7 | Fix order number collision with random suffix | BUG-02 |
| 8 | Add `@Processor('payment')` worker | BUG-05 |
| 9 | Add `POST /auth/logout` | BUG-10 |
| 10 | Validate env vars at startup with `joi` | SEC-08, INFRA-04 |
| 11 | Add rate limiting with `@nestjs/throttler` | SEC-01 |
| 12 | Add `ProductName` snapshot to `OrderItem` | DB-03 |

---

## Phase 2 — Essential Missing Features (Core E-Commerce)

Without these, the backend is not a complete e-commerce backend.

| # | Task | Reference |
|---|---|---|
| 1 | Admin: update order status (`PROCESSING → SHIPPED → DELIVERED`) | FEAT-04 |
| 2 | Admin: update / soft-delete products | FEAT-05 |
| 3 | Admin: create / update / delete categories | FEAT-05 |
| 4 | Add pagination to all list endpoints | FEAT-07 |
| 5 | Address CRUD endpoints for users | FEAT-06 |
| 6 | Add product sorting (price, newest) | FEAT-14 |
| 7 | Fix `track` endpoint to require email | SEC-09 |
| 8 | Add `POST /auth/logout` (if not done in Phase 1) | BUG-10 |
| 9 | Add DB indexes for frequent query columns | DB-01 |
| 10 | Add soft delete to `Product` | DB-02 |

---

## Phase 3 — Product Catalog Improvements

| # | Task | Reference |
|---|---|---|
| 1 | Product variants (size / color / SKU) | FEAT-02 |
| 2 | Product image gallery | FEAT-03 |
| 3 | Product review & rating system | FEAT-09 |
| 4 | Low-stock alerts via BullMQ job | FEAT-15 |

---

## Phase 4 — Customer Experience Features

| # | Task | Reference |
|---|---|---|
| 1 | Cart system (server-side) | FEAT-01 |
| 2 | Wishlist | FEAT-10 |
| 3 | Coupon / discount system | FEAT-08, DB-08 |
| 4 | Refund flow | FEAT-11 |
| 5 | Newsletter unsubscribe endpoint + token | DB-11 |

---

## Phase 5 — Admin & Analytics

| # | Task | Reference |
|---|---|---|
| 1 | Admin dashboard stats endpoint | FEAT-12 |
| 2 | Admin user management (list, ban, change role) | n/a |
| 3 | Shipping tracking number on orders | FEAT-13 |
| 4 | DB-stored shipping rules (dynamic delivery fee) | DB-07 |

---

## Phase 6 — Code Quality & Observability

| # | Task | Reference |
|---|---|---|
| 1 | Replace `user: any` with `JwtUser` interface | QUAL-01 |
| 2 | Add global Prisma exception filter | QUAL-02 |
| 3 | Add response DTOs / serialization layer | QUAL-05 |
| 4 | Add `@nestjs/terminus` health check | QUAL-12, INFRA-03 |
| 5 | Add `compression` middleware | QUAL-13, INFRA-05 |
| 6 | Add structured error logging in services | QUAL-06 |
| 7 | Add `@ApiResponse` decorators to Swagger | QUAL-08 |
| 8 | Organize DTOs into subfolders | QUAL-03 |
| 9 | Move constants/magic values to config | QUAL-04 |
| 10 | Add `timingSafeEqual` to webhook check | SEC-05 |

---

## Phase 7 — Testing & CI/CD

| # | Task | Reference |
|---|---|---|
| 1 | Unit tests: `auth.service`, `orders.service`, `payments.service` | QUAL-15 |
| 2 | Integration tests with a test DB | QUAL-15 |
| 3 | E2E tests for critical flows (register → order → pay) | QUAL-15 |
| 4 | GitHub Actions CI: lint + test on PR | INFRA-10 |
| 5 | Add Dockerfile migration step | INFRA-07 |

---

## Summary Counts

| Category | Count |
|---|---|
| Critical Bugs | 10 |
| Missing E-Commerce Features | 15 |
| Security Issues | 9 |
| Code Quality Issues | 15 |
| Database/Schema Gaps | 11 |
| Infrastructure/DevOps | 10 |
| **Total findings** | **70** |
