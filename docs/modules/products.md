# Products Module

**Location:** `backend/src/products/`

Manages the product catalog, categories, and product gallery images.

## Files

| File | Purpose |
|---|---|
| `products.controller.ts` | HTTP route handlers |
| `products.service.ts` | Business logic and query building |
| `products.module.ts` | Module definition |
| `dto.ts` | Request DTOs |

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/products` | No | List products (filtered, sorted, paginated) |
| GET | `/products/categories` | No | List all categories |
| GET | `/products/:slug` | No | Get single product by slug |
| POST | `/products` | Admin | Create product |
| PATCH | `/products/:id` | Admin | Update product |
| DELETE | `/products/:id` | Admin | Soft-delete product |
| POST | `/products/:id/images` | Admin | Add gallery image |
| DELETE | `/products/:id/images/:imageId` | Admin | Remove gallery image |
| POST | `/products/categories` | Admin | Create category |

## Query Filters (`GET /products`)

| Parameter | Type | Description |
|---|---|---|
| `search` | string | Case-insensitive match in `name` and `description` |
| `category` | string | Filter by category slug |
| `brand` | string | Filter by brand (case-insensitive contains) |
| `type` | `PRODUCT\|SERVICE\|BOUTIQUE\|REGISTRY` | Filter by product type |
| `location` | string | Filter by location (contains) |
| `minPrice` | number | Minimum price (inclusive) |
| `maxPrice` | number | Maximum price (inclusive) |
| `minRating` | number | Minimum `avgRating` (0–5) |
| `inStock` | boolean | `true` = only products with `stock > 0` |
| `isBooked` | boolean | Filter by `isBooked` flag |
| `sortBy` | string | See sort options below |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

### Sort Options

| `sortBy` value | Behaviour |
|---|---|
| `price_asc` | Cheapest first |
| `price_desc` | Most expensive first |
| `newest` | Most recently created first (default) |
| `popular` | Highest `reviewCount` first |
| `rating_desc` | Highest `avgRating` first |

## DTOs

### CreateProductDto
```typescript
{
  name: string;
  description: string;
  price: number;           // positive
  stock: number;           // non-negative integer
  imageUrl: string;        // URL
  categoryId?: string;
  brand?: string;
  type?: ProductType;      // default: PRODUCT
  location?: string;
  isBooked?: boolean;
}
```

### UpdateProductDto

Same as `CreateProductDto`, all fields optional.

### CreateCategoryDto
```typescript
{
  name: string;
  slug: string;   // URL-friendly, unique
}
```

### AddProductImageDto
```typescript
{
  url: string;
  position?: number;   // display order, default 0
}
```

## Behavior Notes

- All filters are additive (AND logic) — every provided filter must match.
- `isActive = false` products are excluded from public listing. Soft-delete sets this flag.
- `avgRating` and `reviewCount` are maintained by the Reviews module — not calculated on the fly.
- Product slug must be unique; it is used as the canonical URL identifier.
- `price` is stored as `Decimal` to avoid floating-point precision errors.
