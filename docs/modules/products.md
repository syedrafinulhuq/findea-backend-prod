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
| GET | `/products/filters` | No | Facet counts for the search/filter sidebar |
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
| `category` | string[] | Filter by category slug(s) — repeat the param or comma-separate, e.g. `?category=woman,man` |
| `brand` | string | Filter by brand (case-insensitive contains) |
| `type` | `PRODUCT\|SERVICE\|BOUTIQUE\|REGISTRY` | Filter by product type |
| `location` | string[] | Filter by location(s) (exact, case-insensitive) — repeat the param or comma-separate, e.g. `?location=London,Paris` |
| `minPrice` | number | Minimum price (inclusive) |
| `maxPrice` | number | Maximum price (inclusive) |
| `minRating` | number | Minimum `avgRating` (0–5) |
| `inStock` | boolean | `true` = only products with `stock > 0` |
| `booked` | boolean | Filter by `Product.isBooked` flag |
| `sortBy` | string | See sort options below |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

## Filter Facets (`GET /products/filters`)

Returns the option counts needed to render the search/filter sidebar. Accepts the same query parameters as `GET /products` (excluding `sortBy`/`page`/`limit`) — each facet's counts reflect every *other* applied filter, so the dimension being counted isn't filtered against itself.

```typescript
{
  total: number;                                     // matches the "X Products found" header
  type: { value: 'ALL' | ProductType; label: string; count: number }[];      // Type section
  category: { slug: string; name: string; count: number }[];                 // Category section
  price: { min: string | null; max: string | null };                         // Price slider bounds
  availability: { inStock: number; booked: number };                         // Availability section
  rating: { minRating: 4 | 3 | 2 | 1; count: number }[];                      // Rating "X and up" section
  location: { value: string; count: number }[];                              // Location section
}
```

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
- `category` and `location` accept multiple values (OR within the dimension); selecting "Fashion" and "Jewelry" returns products in either category.
- `isActive = false` products are excluded from public listing. Soft-delete sets this flag.
- `avgRating` and `reviewCount` are maintained by the Reviews module — not calculated on the fly.
- Product slug must be unique; it is used as the canonical URL identifier.
- `price` is stored as `Decimal` to avoid floating-point precision errors.
