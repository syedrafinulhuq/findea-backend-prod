# Reviews Module

**Location:** `backend/src/reviews/`

Manages product reviews and ratings, and keeps `Product.avgRating` / `Product.reviewCount` in sync.

## Files

| File | Purpose |
|---|---|
| `reviews.controller.ts` | HTTP route handlers |
| `reviews.service.ts` | Business logic + rating recalculation |
| `reviews.module.ts` | Module definition |
| `dto.ts` | Request DTOs |

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/reviews/product/:productId` | Public | List reviews for a product |
| POST | `/reviews` | Customer | Create a review |
| PATCH | `/reviews/:id` | Customer | Update own review |
| DELETE | `/reviews/:id` | Customer/Admin | Delete a review |

## DTOs

### CreateReviewDto
```typescript
{
  productId: string;
  rating: number;     // integer 1-5
  comment: string;
  orderId?: string;   // optional, links review to a verified purchase
}
```

### UpdateReviewDto
```typescript
{
  rating?: number;    // integer 1-5
  comment?: string;
}
```

## Behavior Notes

- `Review` has a unique constraint on `(userId, productId)` — a user can only review a product once. Use `PATCH` to edit an existing review.
- After every create, update, or delete operation, `recalculateProductRating()` runs:
  1. Aggregates all reviews for the product (`AVG(rating)`, `COUNT(*)`).
  2. Updates `Product.avgRating` and `Product.reviewCount`.
- `GET /reviews/product/:productId` is public and includes the reviewer's `firstName` (not full profile) for display.
- Users can only update/delete their own reviews; admins can delete any review.
