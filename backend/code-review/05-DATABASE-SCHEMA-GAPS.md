# Database & Schema Gaps

---

## ✅ DB-01 — No Database Indexes on Frequently Queried Columns

**File:** `prisma/schema.prisma`
**Severity:** HIGH (performance at scale)
**Status: FIXED** — Migration `20260605000000` adds indexes on all high-traffic columns.

Added: `Order(userId)`, `Order(customerEmail)`, `Order(status)`, `OrderItem(productId)`, `CartItem(cartId)`, `WishlistItem(userId)`, `Review(productId)`.

---

## DB-02 — No Soft Delete on Products or Orders

**Severity:** HIGH
**Status: PARTIALLY FIXED** — `Product` uses `isActive: false` as a soft-delete flag (set by `DELETE /products/:id`). True `deletedAt DateTime?` timestamp not added yet. Orders are never deleted.

---

## ✅ DB-03 — `OrderItem` Snapshot Does Not Store Product Name

**Severity:** HIGH (data integrity)
**Status: FIXED** — `productName String` added to `OrderItem`. `orders.service.ts` now populates it from `product.name` at the time of order creation. Historical orders are immune to product renames.

---

## DB-04 — `Category` Has No `updatedAt` or `description`

**Severity:** LOW
**Status: OPEN**

---

## DB-05 — `OrderItem` Has No `updatedAt`

**Severity:** LOW
**Status: OPEN**

---

## DB-06 — `flutterwaveTxId` Has No Unique Constraint

**Severity:** LOW-MEDIUM
**Status: OPEN**

---

## DB-07 — Delivery Fee Is Hardcoded, Not Stored as a Rule

**Severity:** MEDIUM
**Status: OPEN** — Still hardcoded as `Decimal(80)` in `orders.service.ts`. A `ShippingRule` model is the right long-term fix.

---

## ✅ DB-08 — No `Coupon` / `Discount` Model

**See:** FEAT-08
**Status: FIXED** — `Coupon` model added with `CouponType` enum (`PERCENTAGE` / `FIXED`), `minOrder`, `maxUses`, `usedCount`, `expiresAt`. `Order` now has `couponId` and `discountAmount` fields.

---

## DB-09 — No `ProductVariant` Model

**See:** FEAT-02
**Status: OPEN** — Deferred.

---

## DB-10 — User `phone` Has No Format Validation

**Severity:** LOW
**Status: OPEN**

---

## ✅ DB-11 — `NewsletterSubscriber` Has No Unsubscribe Token

**Severity:** MEDIUM (legal compliance — GDPR / CAN-SPAM)
**Status: FIXED** — `unsubscribeToken String? @unique` added to `NewsletterSubscriber`. Token is generated with `randomBytes(32)` on subscribe. `GET /newsletter/unsubscribe/:token` endpoint deletes the subscriber record.
