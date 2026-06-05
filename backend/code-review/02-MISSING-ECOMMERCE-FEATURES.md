# Missing E-Commerce Features

These are features that are standard in any production e-commerce backend and are entirely absent from the current codebase.

---

## FEAT-01 — No Cart System

**Priority:** HIGH

The frontend adds items to a cart, but there is no backend cart. This means:
- Cart state lives only on the client (localStorage / cookie) — it is lost when the user clears storage or switches devices.
- No server-side validation of cart contents before checkout.
- No price integrity check at checkout time (a client could manipulate item prices).

**Required additions:**
- `Cart` model in schema: `id, userId, createdAt, updatedAt`
- `CartItem` model: `id, cartId, productId, quantity, addedAt`
- `POST /cart/items` — add item
- `PATCH /cart/items/:id` — update quantity
- `DELETE /cart/items/:id` — remove item
- `GET /cart` — get cart with items
- `DELETE /cart` — clear cart
- On checkout, validate cart items and prices server-side instead of trusting client-submitted quantities.

---

## FEAT-02 — No Product Variants (Size / Color / SKU)

**Priority:** HIGH — especially for a fashion platform

The `Product` model has a single `price` and `stock`. Real fashion products have:
- Multiple sizes (S, M, L, XL)
- Multiple colors
- Each combination (SKU) has its own stock, price, and image

**Required additions:**
```prisma
model ProductVariant {
  id        String   @id @default(cuid())
  productId String
  size      String?
  color     String?
  sku       String   @unique
  price     Decimal  @db.Decimal(10, 2)
  stock     Int      @default(0)
  imageUrl  String?
  product   Product  @relation(...)
  orderItems OrderItem[]
}
```
`OrderItem` should reference `ProductVariant` (not just `Product`) and stock decrement should happen on the variant.

---

## FEAT-03 — No Product Gallery (Multiple Images)

**Priority:** MEDIUM

`Product` has a single `imageUrl` string. Real products need a gallery.

**Required addition:**
```prisma
model ProductImage {
  id        String  @id @default(cuid())
  productId String
  url       String
  position  Int     @default(0)
  product   Product @relation(...)
}
```

---

## FEAT-04 — No Admin Order Status Management

**Priority:** HIGH

Admins can list all orders but cannot update order status. The `OrderStatus` enum has `PROCESSING`, `SHIPPED`, `DELIVERED`, `REFUNDED` — none of these are reachable via the API after `PAID`.

**Required:**
- `PATCH /orders/:orderNumber/status` (admin-only) — update status with validation of allowed transitions
- Order status state machine: `PENDING → PAID (by payment webhook) → PROCESSING → SHIPPED → DELIVERED`

---

## FEAT-05 — No Product CRUD (Update / Delete)

**Priority:** HIGH

Admin can create products (`POST /products`) but cannot:
- Update product details, price, or stock (`PATCH /products/:id`)
- Deactivate / soft-delete a product (`DELETE /products/:id` sets `isActive: false`)
- Manage categories (create/update/delete)

---

## FEAT-06 — No Address Management Endpoints

**Priority:** MEDIUM

The `Address` model exists in the DB and is returned with `GET /users/me`, but there are no endpoints to:
- `POST /users/me/addresses` — add address
- `PATCH /users/me/addresses/:id` — update address
- `DELETE /users/me/addresses/:id` — delete address
- `PATCH /users/me/addresses/:id/default` — set default address

---

## FEAT-07 — No Pagination on Any List Endpoint

**Priority:** HIGH — will fail at scale

Both `GET /products` and `GET /orders` (admin) return the entire table with no limit. At 10,000 products this will be unacceptably slow and memory-heavy.

**Required for every list endpoint:**
```ts
export class PaginationDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
}
```
Return `{ data: [...], total, page, limit, totalPages }`.

---

## FEAT-08 — No Coupon / Discount System

**Priority:** MEDIUM

No promo codes, percentage discounts, fixed discounts, or minimum-order thresholds.

**Required additions:**
```prisma
model Coupon {
  id          String   @id @default(cuid())
  code        String   @unique
  type        CouponType  // PERCENTAGE | FIXED
  value       Decimal
  minOrder    Decimal?
  maxUses     Int?
  usedCount   Int      @default(0)
  expiresAt   DateTime?
  isActive    Boolean  @default(true)
}
```
- `POST /orders` should accept optional `couponCode` and validate/apply it.
- `Order` model needs `discountAmount` and `couponId` fields.

---

## FEAT-09 — No Review / Rating System

**Priority:** MEDIUM

No product reviews, star ratings, or verified-purchase checks.

---

## FEAT-10 — No Wishlist

**Priority:** LOW-MEDIUM

Users cannot save products for later without adding to cart.

---

## FEAT-11 — No Refund Flow

**Priority:** MEDIUM

`REFUNDED` exists in `OrderStatus` but there is no:
- `POST /orders/:id/refund` endpoint (admin)
- Flutterwave refund API call
- `REFUNDED` state in the cancel/status flow

---

## FEAT-12 — No Admin Dashboard Stats Endpoint

**Priority:** MEDIUM

No `GET /admin/stats` endpoint for revenue totals, order counts by status, top products, etc. Essential for any admin panel.

---

## FEAT-13 — No Shipping Tracking Number on Orders

**Priority:** LOW-MEDIUM

The `Order` model has no `trackingNumber` or `shippingProvider` field. Once an order is shipped, there is no way to record where to track it.

---

## FEAT-14 — No Product Sorting Options

**Priority:** MEDIUM

`GET /products` only supports search and category filter. No sorting by:
- Price (asc/desc)
- Newest
- Popularity (order count)

```ts
export class ProductQueryDto {
  @IsOptional() @IsIn(['price_asc', 'price_desc', 'newest', 'popular']) sortBy?: string;
}
```

---

## FEAT-15 — No Inventory Low-Stock Alerts

**Priority:** LOW-MEDIUM

No mechanism to notify admins when a product's stock falls below a threshold.
