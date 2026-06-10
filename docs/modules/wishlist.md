# Wishlist Module

**Location:** `backend/src/wishlist/`

Manages a per-user list of saved/favorited products.

## Files

| File | Purpose |
|---|---|
| `wishlist.controller.ts` | HTTP route handlers |
| `wishlist.service.ts` | Business logic |
| `wishlist.module.ts` | Module definition |

## Endpoints

All endpoints require `Authorization: Bearer <accessToken>`.

| Method | Path | Description |
|---|---|---|
| GET | `/wishlist` | Get current user's wishlist |
| POST | `/wishlist/:productId` | Add a product to the wishlist |
| DELETE | `/wishlist/:productId` | Remove a product from the wishlist |

## Behavior Notes

- `WishlistItem` has a unique constraint on `(userId, productId)` — adding a product already in the wishlist is a no-op (or returns a conflict, depending on implementation) rather than creating a duplicate.
- `GET /wishlist` returns items with nested product details for display.
- No quantity or variant tracking — wishlist items are simple product references.
