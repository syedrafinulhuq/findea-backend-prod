# Database & Schema Gaps

---

## DB-01 — No Database Indexes on Frequently Queried Columns

**File:** `prisma/schema.prisma`  
**Severity:** HIGH (performance at scale)

The following queries happen on every request but have no index:

| Table | Column | Used In |
|---|---|---|
| `Order` | `customerEmail` | `track()` — WHERE clause |
| `Order` | `userId` | `mine()` — WHERE clause |
| `Order` | `status` | `expireOldPendingOrders()` — WHERE clause |
| `Order` | `createdAt` | Auto-cancel cron — WHERE clause |
| `Product` | `isActive` | `list()` — WHERE clause |
| `Product` | `categoryId` | `list()` — WHERE clause |
| `User` | `passwordResetExpires` | `resetPassword()` — WHERE clause |

**Fix:** Add `@@index` to the schema:
```prisma
model Order {
  @@index([userId])
  @@index([customerEmail])
  @@index([status, createdAt])
}

model Product {
  @@index([isActive, categoryId])
  @@index([isActive, createdAt])
}
```

---

## DB-02 — No Soft Delete on Products or Orders

**Severity:** HIGH

`Product` and `Order` have no `deletedAt DateTime?` column. If an admin deletes a product:
- `OrderItem.productId` has `ON DELETE RESTRICT` — the product cannot be deleted while orders reference it.
- If you change it to `ON DELETE SET NULL`, historical orders lose product name, price, and description.

**Fix:** Never physically delete products. Add:
```prisma
model Product {
  deletedAt DateTime?  // null = active, set = soft-deleted
}
```
And filter `deletedAt: null` in all queries.

---

## DB-03 — `OrderItem` Snapshot Does Not Store Product Name

**Severity:** HIGH (data integrity)

`OrderItem` stores `unitPrice` but not the product's `name` or `imageUrl` at the time of purchase. If a product is renamed or its image changes, historical orders will reflect the new name/image instead of what the customer actually ordered.

**Fix:** Add `productName` and `productImageUrl` snapshot fields to `OrderItem`:
```prisma
model OrderItem {
  productName     String
  productImageUrl String?
  // ...existing fields
}
```

---

## DB-04 — `Category` Has No `updatedAt` or `description`

**Severity:** LOW

Minor inconsistency. `Category` is the only model without `updatedAt`. Add:
```prisma
model Category {
  description String?
  updatedAt   DateTime @updatedAt
}
```

---

## DB-05 — `OrderItem` Has No `updatedAt`

**Severity:** LOW

All other models have `updatedAt`. `OrderItem` is missing it. This makes auditing impossible.

---

## DB-06 — Payment `transactionRef` Is Always Unique But `flutterwaveTxId` Is Not

**Severity:** LOW-MEDIUM

`transactionRef` is the ref you generate (`FID-PAY-...`), which is good. But `flutterwaveTxId` (the integer ID Flutterwave assigns) has no unique constraint. If a webhook fires twice with the same Flutterwave transaction, the `payment.update` would be idempotent, but without a constraint, bugs could create duplicate records.

**Fix:** Add `@@unique([flutterwaveTxId])` with a `nullable` override.

---

## DB-07 — Delivery Fee Is Hardcoded, Not Stored as a Rule

**Severity:** MEDIUM

The delivery fee is hardcoded as `80` in `orders.service.ts`. This means:
- No way to have free shipping above a threshold.
- No per-city or per-zone shipping rates.
- No way to change the fee without a code deploy.

**Suggested addition:**
```prisma
model ShippingRule {
  id          String  @id @default(cuid())
  name        String
  fee         Decimal @db.Decimal(10, 2)
  minOrderAmt Decimal? @db.Decimal(10, 2)  // free shipping if order >= this
  isActive    Boolean @default(true)
}
```

---

## DB-08 — No `Coupon` / `Discount` Model

**See:** FEAT-08

---

## DB-09 — No `ProductVariant` Model

**See:** FEAT-02

---

## DB-10 — User `phone` Has No Format Validation at DB Level

**Severity:** LOW

Phone numbers are stored as free-text strings. A `+8801712345678` and `01712345678` are stored as separate entries. Add a validator at the DTO level (`@Matches(/^(\+?880|0)[1-9]\d{9}$/)`) or normalize on write.

---

## DB-11 — `NewsletterSubscriber` Has No `unsubscribedAt` or Token

**Severity:** MEDIUM (legal compliance — GDPR / CAN-SPAM)

There is no way to unsubscribe from the newsletter via API, and no unsubscribe token is generated. This is non-compliant with GDPR and CAN-SPAM which require a working unsubscribe mechanism.

**Fix:**
```prisma
model NewsletterSubscriber {
  isActive         Boolean  @default(true)
  unsubscribeToken String   @unique @default(cuid())
  unsubscribedAt   DateTime?
}
```
Add `GET /newsletter/unsubscribe?token=xxx` endpoint.
