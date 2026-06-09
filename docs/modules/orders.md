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
| POST | `/orders` | Customer | Create order |
| GET | `/orders/mine` | Customer | List own orders |
| GET | `/orders/track/:orderNumber` | Public | Track order by number + email |
| GET | `/orders` | Admin | List all orders |
| PATCH | `/orders/:orderNumber/status` | Admin | Update order status |
| POST | `/orders/:orderNumber/cancel` | Customer | Cancel a pending order |
| POST | `/orders/:orderNumber/refund` | Admin | Mark order as refunded |

## Order Status Lifecycle

```
PENDING
  ├── → PAID (via payment webhook)
  │     └── → PROCESSING
  │             └── → SHIPPED
  │                   └── → DELIVERED
  ├── → CANCELLED (by customer or cron job)
  └── → REFUNDED (by admin)
```

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
  customerPhone: string;
  shippingLine1: string;
  shippingLine2?: string;
  shippingCity: string;
  shippingState: string;
  shippingCountry?: string;    // default: Bangladesh
  couponCode?: string;
  deliveryFee?: number;        // default: 0
}
```

### CancelOrderDto
```typescript
{
  reason?: string;
}
```

### UpdateOrderStatusDto
```typescript
{
  status: OrderStatus;
  trackingNumber?: string;   // required when status = SHIPPED
}
```

### OrderQueryDto (admin listing)
```typescript
{
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;    // searches customerEmail, orderNumber
}
```

## Order Creation Flow

Order creation is wrapped in a single `prisma.$transaction` to ensure atomicity:

1. Validate all product IDs exist and are active.
2. Check sufficient stock for each item.
3. If `couponCode` provided:
   - Verify coupon is active, not expired, under `maxUses` limit.
   - Calculate discount amount.
   - Increment `coupon.usedCount`.
4. Decrement `product.stock` for each item.
5. Create `Order` record with totals snapshot.
6. Create `OrderItem` records (snapshot of `productName` and `unitPrice`).
7. Create `Payment` record with status `PENDING`.

After the transaction, an `order-created` email job is queued.

## Order Tracking

`GET /orders/track/:orderNumber?email=customer@email.com`

This is a public endpoint that requires the order number and the customer email used at checkout. It returns the order status and tracking number without requiring login, suitable for guest orders.

## Auto-Cancellation

A cron job runs every midnight and cancels all `PENDING` orders that are older than 24 hours. See [Jobs & Queue](./jobs-queue.md).

## Behavior Notes

- `orderNumber` is generated with a timestamp and random suffix to prevent collisions (e.g. `ORD-20240615-A3X9`).
- `OrderItem` snapshots `productName` and `unitPrice` — these do not change even if the product is later updated.
- Only `PENDING` orders can be cancelled by the customer.
- Delivery fee and discount amounts are stored on the order; totals are pre-calculated snapshots.
