# Cart Module

**Location:** `backend/src/cart/`

Manages a per-user shopping cart.

## Files

| File | Purpose |
|---|---|
| `cart.controller.ts` | HTTP route handlers |
| `cart.service.ts` | Business logic |
| `cart.module.ts` | Module definition |
| `dto.ts` | Request DTOs |

## Endpoints

All endpoints require `Authorization: Bearer <accessToken>`.

| Method | Path | Description |
|---|---|---|
| GET | `/cart` | Get current user's cart with items |
| POST | `/cart/items` | Add a product to the cart |
| PATCH | `/cart/items/:id` | Update item quantity |
| DELETE | `/cart/items/:id` | Remove an item |
| DELETE | `/cart` | Clear the entire cart |

## DTOs

### AddToCartDto
```typescript
{
  productId: string;
  quantity: number;   // positive integer, default 1
}
```

### UpdateCartItemDto
```typescript
{
  quantity: number;   // positive integer
}
```

## Behavior Notes

- Each user has exactly one `Cart` (1-to-1 relation), created lazily on first access.
- `CartItem` has a unique constraint on `(cartId, productId)` — adding an existing product increments its quantity instead of creating a duplicate row.
- Adding/updating an item validates that `quantity <= product.stock`. If insufficient stock, the request fails with `400`.
- `GET /cart` returns items with nested product details (`name`, `price`, `imageUrl`, `stock`) for display without extra requests.
- `DELETE /cart` removes all `CartItem` rows for the user's cart but keeps the `Cart` record itself.
