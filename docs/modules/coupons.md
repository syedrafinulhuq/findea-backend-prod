# Coupons Module

**Location:** `backend/src/coupons/`

Manages discount codes applied at checkout.

## Files

| File | Purpose |
|---|---|
| `coupons.controller.ts` | HTTP route handlers |
| `coupons.service.ts` | Business logic |
| `coupons.module.ts` | Module definition |
| `dto.ts` | Request DTOs |

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/coupons/validate/:code` | Public | Validate a coupon code |
| GET | `/coupons` | Admin | List all coupons |
| POST | `/coupons` | Admin | Create a coupon |
| PATCH | `/coupons/:id` | Admin | Update a coupon |
| DELETE | `/coupons/:id` | Admin | Delete a coupon |

## DTOs

### CreateCouponDto
```typescript
{
  code: string;          // unique, case-sensitive
  type: 'PERCENTAGE' | 'FIXED';
  value: number;         // percent (0-100) or fixed amount
  minOrder?: number;     // minimum order subtotal to apply
  maxUses?: number;      // null/undefined = unlimited
  expiresAt?: string;    // ISO date, null/undefined = never expires
  isActive?: boolean;    // default: true
}
```

### UpdateCouponDto

Same fields as `CreateCouponDto`, all optional.

## Validation Rules

A coupon is valid if **all** of the following hold:
- `isActive === true`
- `expiresAt` is null or in the future
- `usedCount < maxUses` (if `maxUses` is set)
- Order subtotal `>= minOrder` (if `minOrder` is set)

## Discount Calculation

| Type | Formula |
|---|---|
| `PERCENTAGE` | `discount = subtotal * (value / 100)` |
| `FIXED` | `discount = min(value, subtotal)` (cannot exceed subtotal) |

## Behavior Notes

- `usedCount` is incremented atomically inside the order-creation transaction (see [Orders module](./orders.md)) — prevents race conditions on concurrent checkouts near the `maxUses` limit.
- `GET /coupons/validate/:code` is public so the frontend can preview the discount before checkout, but actual application happens during order creation.
- Coupon codes are case-sensitive as stored.

## Seeded Coupons

| Code | Type | Value | Min Order | Max Uses | Expires |
|---|---|---|---|---|---|
| `WELCOME10` | PERCENTAGE | 10% | ৳50 | 100 | — |
| `FLAT500` | FIXED | ৳500 | ৳2000 | 50 | — |
| `SUMMER15` | PERCENTAGE | 15% | ৳100 | 200 | 2026-12-31 |
| `DEVTEST` | PERCENTAGE | 50% | — | — | — |
