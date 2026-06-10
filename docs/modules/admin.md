# Admin Module

**Location:** `backend/src/admin/`

Provides aggregated dashboard statistics for administrators.

## Files

| File | Purpose |
|---|---|
| `admin.controller.ts` | HTTP route handlers |
| `admin.service.ts` | Aggregation queries |
| `admin.module.ts` | Module definition |

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/stats` | Admin | Dashboard overview statistics |

## Response Shape

```json
{
  "overview": {
    "totalRevenue": "125000.00",
    "totalOrders": 48,
    "totalUsers": 120,
    "totalProducts": 24
  },
  "ordersByStatus": {
    "PENDING": 5,
    "PAID": 10,
    "PROCESSING": 8,
    "SHIPPED": 15,
    "DELIVERED": 8,
    "CANCELLED": 2,
    "REFUNDED": 0
  },
  "recentOrders": [
    { "orderNumber": "ORD-...", "customerName": "...", "total": "...", "status": "...", "createdAt": "..." }
  ],
  "topProducts": [
    { "id": "...", "name": "...", "reviewCount": 12, "avgRating": 4.5 }
  ],
  "lowStockProducts": [
    { "id": "...", "name": "...", "stock": 2 }
  ]
}
```

## Behavior Notes

- `totalRevenue` sums `total` across orders with status `PAID`, `PROCESSING`, `SHIPPED`, or `DELIVERED` (i.e. successfully paid orders).
- `ordersByStatus` is a count grouped by `OrderStatus` enum value.
- `recentOrders` returns the most recently created orders (typically last 5–10).
- `topProducts` ranks products by `reviewCount` and/or `avgRating`.
- `lowStockProducts` lists products where `stock <= LOW_STOCK_THRESHOLD` (configurable via env var).
- This is a single read-heavy aggregation endpoint; for large datasets consider caching.
