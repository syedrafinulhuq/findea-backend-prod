# Missing E-Commerce Features

These are features that are standard in any production e-commerce backend and are entirely absent from the current codebase.

---

## ✅ FEAT-01 — No Cart System

**Priority:** HIGH
**Status: FIXED** — Full server-side cart module added at `src/cart/`.

- `Cart` and `CartItem` models in schema
- `GET /cart` — get cart with items + product thumbnail
- `POST /cart/items` — add item (validates stock)
- `PATCH /cart/items/:id` — update quantity (validates stock)
- `DELETE /cart/items/:id` — remove item
- `DELETE /cart` — clear cart
- All endpoints require `JwtAuthGuard`; cart is tied to the authenticated user.

---

## FEAT-02 — No Product Variants (Size / Color / SKU)

**Priority:** HIGH — especially for a fashion platform
**Status: OPEN** — Deferred. Requires a major schema refactor (new `ProductVariant` model, `OrderItem` must reference variant, stock decrement must target variant). Skipped to avoid breaking existing order/cart flows.

---

## ✅ FEAT-03 — No Product Gallery (Multiple Images)

**Priority:** MEDIUM
**Status: FIXED** — `ProductImage` model added to schema with migration.

- `POST /products/:id/images` (admin) — add image with optional `position`
- `DELETE /products/:id/images/:imageId` (admin) — remove image
- `GET /products` and `GET /products/:slug` now include `images` sorted by `position`

---

## ✅ FEAT-04 — No Admin Order Status Management

**Priority:** HIGH
**Status: FIXED** — `PATCH /orders/:orderNumber/status` added (admin-only).

- Full state machine: `PAID → PROCESSING → SHIPPED → DELIVERED → REFUNDED`
- Invalid transitions throw `BadRequestException`
- `trackingNumber` can be set when transitioning to `SHIPPED`

---

## ✅ FEAT-05 — No Product CRUD (Update / Delete)

**Priority:** HIGH
**Status: FIXED** — Admin product management now complete.

- `PATCH /products/:id` — update any product field
- `DELETE /products/:id` — soft-delete (sets `isActive: false`)
- `POST /products/categories` — create a new category
- All admin-only via `JwtAuthGuard + RolesGuard`

---

## ✅ FEAT-06 — No Address Management Endpoints

**Priority:** MEDIUM
**Status: FIXED** — Full address CRUD at `src/users/`.

- `POST /users/me/addresses` — add address
- `PATCH /users/me/addresses/:id` — update address
- `DELETE /users/me/addresses/:id` — delete address
- `PATCH /users/me/addresses/:id/default` — set as default (clears other defaults atomically)

---

## ✅ FEAT-07 — No Pagination on Any List Endpoint

**Priority:** HIGH — will fail at scale
**Status: FIXED** — Both list endpoints now paginated.

- `GET /products?page=1&limit=20` — returns `{ data, total, page, limit, totalPages }`
- Admin `GET /orders?page=1&limit=20&status=PENDING` — same shape with optional status filter

---

## ✅ FEAT-08 — No Coupon / Discount System

**Priority:** MEDIUM
**Status: FIXED** — Full coupon module at `src/coupons/`.

- `Coupon` model with `PERCENTAGE` / `FIXED` types, `minOrder`, `maxUses`, `expiresAt`
- `GET /coupons/validate/:code` — public endpoint to check coupon validity
- Admin CRUD: `POST/PATCH/DELETE /coupons`
- `POST /orders` accepts optional `couponCode` — discount applied atomically inside the transaction, `usedCount` incremented
- `Order` records `discountAmount` and `couponId`

---

## ✅ FEAT-09 — No Review / Rating System

**Priority:** MEDIUM
**Status: FIXED** — Review module at `src/reviews/`.

- `GET /reviews/product/:productId` — public, paginated by `createdAt`
- `POST /reviews` — create (1 review per user per product; optional verified-purchase check via `orderId`)
- `PATCH /reviews/:id` — edit own review
- `DELETE /reviews/:id` — delete own review
- `DELETE /reviews/admin/:id` — admin delete any review

---

## ✅ FEAT-10 — No Wishlist

**Priority:** LOW-MEDIUM
**Status: FIXED** — Wishlist module at `src/wishlist/`.

- `GET /wishlist` — get user's wishlist with product details
- `POST /wishlist/:productId` — add to wishlist (409 if already present)
- `DELETE /wishlist/:productId` — remove from wishlist

---

## ✅ FEAT-11 — No Refund Flow

**Priority:** MEDIUM
**Status: FIXED** — `POST /orders/:orderNumber/refund` added (admin-only).

- Validates order is in `DELIVERED`, `PAID`, or `PROCESSING` status
- Sets status to `REFUNDED`
- Note: Flutterwave refund API call is a stub — wire it in when ready

---

## ✅ FEAT-12 — No Admin Dashboard Stats Endpoint

**Priority:** MEDIUM
**Status: FIXED** — `GET /admin/stats` added at `src/admin/`.

Returns in a single response:
- `overview`: totalOrders, totalUsers, totalProducts, totalRevenue, fulfilledOrders, pendingOrders, cancelledOrders
- `ordersByStatus`: count per status
- `recentOrders`: last 5 orders
- `topProducts`: top 5 by units sold
- `lowStockProducts`: products with stock ≤ 5

---

## ✅ FEAT-13 — No Shipping Tracking Number on Orders

**Priority:** LOW-MEDIUM
**Status: FIXED** — `trackingNumber` field added to `Order` model.

- Set via `PATCH /orders/:orderNumber/status` body (`trackingNumber` field)
- Returned in all order responses

---

## ✅ FEAT-14 — No Product Sorting Options

**Priority:** MEDIUM
**Status: FIXED** — `GET /products?sortBy=...` now supports:

- `price_asc` — cheapest first
- `price_desc` — most expensive first
- `newest` — most recently created (default)
- `popular` — sorted by total units sold (`orderItems._count`)

---

## ✅ FEAT-15 — No Inventory Low-Stock Alerts

**Priority:** LOW-MEDIUM
**Status: FIXED** — Hourly cron job in `src/jobs/jobs.service.ts`.

- Runs every hour via `@Cron(CronExpression.EVERY_HOUR)`
- Finds products with `stock ≤ LOW_STOCK_THRESHOLD` (env var, default 5) that haven't been alerted yet
- Queues a `low-stock-alert` BullMQ email job per product
- Sets `product.lowStockAlert = true` to prevent repeat alerts
- Resets `lowStockAlert` flag when stock is replenished above threshold
