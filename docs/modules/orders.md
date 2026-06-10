# Orders Module

**Location:** `backend/src/orders/`

Manages the complete order lifecycle from creation through delivery and cancellation.

## Files

| File | Purpose |
|---|---|
| `orders.controller.ts` | HTTP route handlers |
| `orders.service.ts` | Business logic |
| `orders.module.ts` | Module definition |
| `dto.ts` | Request DTOs |

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/orders` | Public (optional) | Create order — guest or logged-in |
| GET | `/orders/mine` | Customer | List own orders |
| GET | `/orders/track/:orderNumber` | Public | Track order by number + email |
| GET | `/orders` | Admin | List all orders (paginated) |
| PATCH | `/orders/:orderNumber/status` | Admin | Update order status |
| POST | `/orders/:orderNumber/cancel` | Customer | Cancel an order |
| POST | `/orders/:orderNumber/refund` | Admin | Mark order as refunded |

## Order Status Lifecycle

```
PENDING
  ├── → PAID (via payment webhook)
  │     ├── → PROCESSING
  │     │       └── → SHIPPED
  │     │               └── → DELIVERED
  │     ├── → CANCELLED
  │     └── → REFUNDED (admin, from PAID/PROCESSING/DELIVERED)
  └── → CANCELLED (by customer, or by cron job after 24h)
```

Transitions are validated in `updateStatus()` — invalid transitions return `400`.

## DTOs

### CreateOrderDto
```typescript
{
  items: Array<{
    productId: string;
    quantity: number;   // positive integer
  }>;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  shippingLine1: string;
  shippingLine2?: string;
  shippingCity: string;
  shippingState?: string;
  shippingCountry?: string;    // default: Bangladesh
  couponCode?: string;
}
```

> Note: there is no `deliveryFee` field — the server applies a flat ৳80 delivery fee to every order.

### CancelOrderDto
```typescript
{
  reason: string;   // required
}
```

### UpdateOrderStatusDto
```typescript
{
  status: OrderStatus;
  trackingNumber?: string;
}
```

### OrderQueryDto (admin listing)
```typescript
{
  page?: number;     // default 1
  limit?: number;    // default 20, max 100
  status?: OrderStatus;
}
```

## Order Creation Flow

`POST /orders` has no guard — it works for both guests and authenticated users (if a valid access token is sent, `userId` is attached to the order). The whole operation runs inside a single `prisma.$transaction`:

1. Verify all `productId`s exist and are `isActive`.
2. For each item, atomically `updateMany` the product with `stock: { decrement: quantity }` guarded by `stock: { gte: quantity }`. If zero rows are affected, the product is out of stock and the transaction throws `400`.
3. If `couponCode` is provided and the coupon is active, not expired, under `maxUses`, and `subtotal >= minOrder`: calculate the discount and increment `coupon.usedCount`.
4. Compute `total = subtotal + deliveryFee(80) - discountAmount`.
5. Create the `Order` with a generated `orderNumber` (`FID-<Date.now()>-<6 hex chars>`) and nested `OrderItem` records (snapshotting `productName` and `unitPrice`).

After the transaction commits, an `order-created` email job is queued.

A `Payment` record is **not** created here — it's created (via upsert) when `POST /payments/initialize` is called with the new order's `id`.

## Order Tracking

`GET /orders/track/:orderNumber?email=customer@email.com`

Public endpoint. Looks up the order by `(orderNumber, customerEmail)` — both must match. Returns the order with items and payment, suitable for guest order tracking.

## Auto-Cancellation

A cron job runs every midnight and cancels all `PENDING` orders older than 24 hours (sets `cancelReason`, does not currently restore stock). See [Jobs & Queue](./jobs-queue.md).

## Behavior Notes

- `orderNumber` format: `FID-<timestamp>-<6-char hex>` (e.g. `FID-1718000000000-A3F9C1`).
- `OrderItem` snapshots `productName` and `unitPrice` — these do not change even if the product is later updated.
- Cancellable statuses: `PENDING`, `PAID`, `PROCESSING`. `cancel()` requires the order to belong to the requesting user (or be a guest order with no `userId` and no auth).
- Refundable statuses: `PAID`, `PROCESSING`, `DELIVERED`.
- `GET /orders/mine` is not paginated — it returns all of the user's orders ordered by `createdAt desc`.
