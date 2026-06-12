# API Reference

**Base URL:** `/api`  
**Auth:** `Authorization: Bearer <accessToken>` for protected routes  
**Swagger UI:** `http://localhost:4000/docs`

---

## Auth

### POST /auth/register

Register a new customer account.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "Secret@123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+8801700000000"
}
```

**Response `201`:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": "...", "email": "...", "firstName": "...", "role": "CUSTOMER" }
}
```

---

### POST /auth/login

**Body:**
```json
{ "email": "user@example.com", "password": "Secret@123" }
```

**Response `200`:** Same shape as `/auth/register`.

---

### POST /auth/refresh

Exchange a refresh token for new tokens.

**Body:**
```json
{ "refreshToken": "eyJ..." }
```

**Response `200`:** `{ accessToken, refreshToken }`

---

### POST /auth/logout

**Auth required.**

Invalidates the current refresh token.

**Response `200`:** `{ message: "Logged out" }`

---

### POST /auth/forgot-password

Sends OTP to the user's email.

**Body:**
```json
{ "email": "user@example.com" }
```

**Response `200`:** Always succeeds (prevents email enumeration).

---

### POST /auth/reset-password-otp

Reset password using OTP.

**Body:**
```json
{ "email": "user@example.com", "otp": "123456", "newPassword": "NewSecret@123" }
```

**Response `200`:** `{ message: "Password reset" }`

---

## Users

All endpoints require authentication.

### GET /users/me

Returns current user profile.

**Response `200`:**
```json
{
  "id": "...",
  "email": "...",
  "firstName": "...",
  "lastName": "...",
  "phone": "...",
  "role": "CUSTOMER",
  "addresses": [...]
}
```

---

### PATCH /users/me

Update profile fields.

**Body (all optional):**
```json
{ "firstName": "Jane", "lastName": "Smith", "phone": "+8801800000000" }
```

---

### PATCH /users/me/password

**Body:**
```json
{ "currentPassword": "OldPass@123", "newPassword": "NewPass@456" }
```

---

### POST /users/me/addresses

Add a new address.

**Body:**
```json
{
  "label": "Home",
  "line1": "123 Main St",
  "city": "Dhaka",
  "state": "Dhaka Division",
  "postalCode": "1200",
  "country": "Bangladesh",
  "isDefault": true
}
```

---

### PATCH /users/me/addresses/:id

Update an address. Same fields as create, all optional.

---

### DELETE /users/me/addresses/:id

Delete an address.

---

### PATCH /users/me/addresses/:id/default

Mark an address as default.

---

## Products

### GET /products

List products with filters, sorting, and pagination.

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `search` | string | Full-text search in name/description |
| `category` | string[] | Category slug(s) — repeat the param or comma-separate, e.g. `?category=woman,man` |
| `brand` | string | Brand name (case-insensitive) |
| `type` | `PRODUCT\|SERVICE\|BOUTIQUE\|REGISTRY` | Product type |
| `location` | string[] | Location(s), case-insensitive — repeat the param or comma-separate, e.g. `?location=London,Paris` |
| `minPrice` | number | Minimum price |
| `maxPrice` | number | Maximum price |
| `minRating` | number | Minimum average rating (1–5) |
| `inStock` | boolean | Only products with stock > 0 |
| `booked` | boolean | Filter by booking status |
| `sortBy` | `price_asc\|price_desc\|newest\|popular\|rating_desc` | Sort order |
| `page` | number | Page number (default 1) |
| `limit` | number | Items per page (default 20) |

**Response `200`:**
```json
{
  "data": [ { "id": "...", "name": "...", "price": "...", "slug": "...", ... } ],
  "total": 24,
  "page": 1,
  "limit": 20,
  "totalPages": 2
}
```

---

### GET /products/filters

Facet counts for the search/filter sidebar (Type, Category, Price, Availability, Rating, Location sections). Accepts the same filter query params as `GET /products` (`search`, `category`, `brand`, `type`, `location`, `minPrice`, `maxPrice`, `minRating`, `inStock`, `booked`) — `sortBy`/`page`/`limit` are ignored. Each facet's counts apply every *other* active filter, but not its own.

**Response `200`:**
```json
{
  "total": 186,
  "type": [
    { "value": "ALL", "label": "All", "count": 363 },
    { "value": "PRODUCT", "label": "Products", "count": 186 },
    { "value": "SERVICE", "label": "Services", "count": 31 },
    { "value": "BOUTIQUE", "label": "Boutiques", "count": 136 },
    { "value": "REGISTRY", "label": "Registries", "count": 10 }
  ],
  "category": [
    { "slug": "woman", "name": "Woman", "count": 9 }
  ],
  "price": { "min": "45.00", "max": "2450.00" },
  "availability": { "inStock": 300, "booked": 12 },
  "rating": [
    { "minRating": 4, "count": 39 },
    { "minRating": 3, "count": 39 },
    { "minRating": 2, "count": 39 },
    { "minRating": 1, "count": 39 }
  ],
  "location": [
    { "value": "Dhaka", "count": 5 }
  ]
}
```

---

### GET /products/categories

List all categories.

**Response `200`:**
```json
[ { "id": "...", "name": "Woman", "slug": "woman" }, ... ]
```

---

### GET /products/:slug

Get single product by slug.

**Response `200`:**
```json
{
  "id": "...",
  "name": "...",
  "slug": "...",
  "description": "...",
  "price": "2500.00",
  "stock": 10,
  "imageUrl": "...",
  "images": [ { "url": "...", "position": 0 } ],
  "category": { "name": "Woman", "slug": "woman" },
  "brand": "...",
  "avgRating": 4.5,
  "reviewCount": 12,
  "type": "PRODUCT",
  "location": null,
  "isBooked": false
}
```

---

### POST /products

**Admin only.**

**Body:**
```json
{
  "name": "Silk Blouse",
  "description": "...",
  "price": 1800,
  "stock": 50,
  "imageUrl": "https://...",
  "categoryId": "...",
  "brand": "Zara",
  "type": "PRODUCT"
}
```

---

### PATCH /products/:id

**Admin only.** Update product fields (all optional).

---

### DELETE /products/:id

**Admin only.** Soft-deletes the product (`isActive = false`).

---

### POST /products/:id/images

**Admin only.** Add gallery image.

**Body:**
```json
{ "url": "https://...", "position": 1 }
```

---

### DELETE /products/:id/images/:imageId

**Admin only.** Remove gallery image.

---

### POST /products/categories

**Admin only.**

**Body:**
```json
{ "name": "Summer", "slug": "summer" }
```

---

## Cart

All endpoints require authentication.

### GET /cart

Returns the current user's cart.

**Response `200`:**
```json
{
  "id": "...",
  "items": [
    {
      "id": "...",
      "product": { "id": "...", "name": "...", "price": "...", "imageUrl": "..." },
      "quantity": 2
    }
  ]
}
```

---

### POST /cart/items

Add item to cart.

**Body:**
```json
{ "productId": "...", "quantity": 1 }
```

---

### PATCH /cart/items/:id

Update quantity.

**Body:**
```json
{ "quantity": 3 }
```

---

### DELETE /cart/items/:id

Remove a specific item from cart.

---

### DELETE /cart

Clear entire cart.

---

## Wishlist

All endpoints require authentication.

### GET /wishlist

Returns the current user's wishlist.

---

### POST /wishlist/:productId

Add product to wishlist.

---

### DELETE /wishlist/:productId

Remove product from wishlist.

---

## Orders

### POST /orders

**Public** — works for guests as well as logged-in users. If a valid `Authorization: Bearer` header is present, the order is linked to that user (`userId`); otherwise it's a guest order.

A flat **delivery fee of ৳80** is applied automatically by the server — it is not part of the request body.

**Body:**
```json
{
  "items": [
    { "productId": "...", "quantity": 2 }
  ],
  "customerEmail": "user@example.com",
  "customerName": "John Doe",
  "customerPhone": "+8801700000000",
  "shippingLine1": "123 Main St",
  "shippingLine2": "Apt 4B",
  "shippingCity": "Dhaka",
  "shippingState": "Dhaka Division",
  "shippingCountry": "Bangladesh",
  "deliveryMethod": "DELIVERY",
  "deliveryNotes": "Leave with the security guard if not home.",
  "paymentMethod": "WAVE",
  "couponCode": "WELCOME10"
}
```

`customerPhone`, `shippingLine2`, `shippingState`, `shippingCountry` (defaults to `Bangladesh`), `deliveryMethod` (`DELIVERY` | `PICKUP`, defaults to `DELIVERY`), `deliveryNotes`, `paymentMethod` (`WAVE` | `ORANGE` | `MTN` | `PICKUP`), and `couponCode` are optional.

> `paymentMethod` is stored as metadata only — it records the customer's stated preference and is not wired to the Flutterwave payment provider used by `POST /payments/initialize`.

**Response `201`:** the created order, including its items.
```json
{
  "id": "...",
  "orderNumber": "FID-1718000000000-A3F9C1",
  "userId": null,
  "customerEmail": "user@example.com",
  "subtotal": "3970.00",
  "deliveryFee": "80.00",
  "discountAmount": "0.00",
  "total": "4050.00",
  "status": "PENDING",
  "items": [
    { "id": "...", "productId": "...", "productName": "...", "quantity": 2, "unitPrice": "1985.00" }
  ],
  "createdAt": "..."
}
```

`orderNumber` format is `FID-<timestamp>-<6-char hex>`.

To proceed to payment, pass the returned `id` as `orderId` to `POST /payments/initialize` (see [Payments](#payments)).

---

### GET /orders/mine

**Auth required.** Returns all of the current user's orders (with items and payment), newest first. Not paginated.

---

### GET /orders/track/:orderNumber

**Public.** Track order by order number. Requires `?email=customer@email.com` — the email must match `Order.customerEmail`.

---

### PATCH /orders/:orderNumber/status

**Admin only.**

**Body:**
```json
{ "status": "SHIPPED", "trackingNumber": "BD123456789" }
```

`trackingNumber` is optional. Status transitions are validated — e.g. `PAID → PROCESSING/CANCELLED`, `PROCESSING → SHIPPED/CANCELLED`, `SHIPPED → DELIVERED`. Invalid transitions return `400`.

---

### POST /orders/:orderNumber/cancel

**Auth required.** Cancel an order that is still `PENDING`, `PAID`, or `PROCESSING`. A user can only cancel their own orders.

**Body:**
```json
{ "reason": "Changed my mind" }
```

`reason` is required.

---

### POST /orders/:orderNumber/refund

**Admin only.** Marks an order as `REFUNDED`. Only allowed when the order is currently `PAID`, `PROCESSING`, or `DELIVERED`.

---

### GET /orders

**Admin only.** List all orders, paginated.

**Query:** `page` (default 1), `limit` (default 20, max 100), `status` (optional `OrderStatus` filter)

**Response `200`:**
```json
{
  "data": [ { "id": "...", "orderNumber": "...", "status": "...", "total": "...", "items": [...] } ],
  "total": 48,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

## Payments

### POST /payments/initialize

Initiate payment for an order. (No auth required — works for guest orders too.)

**Body:**
```json
{ "orderId": "..." }
```

`orderId` is the order's internal UUID (`Order.id`), returned in the `POST /orders` response — not the human-readable `orderNumber`.

**Response `200`:**
```json
{ "checkoutUrl": "https://checkout.flutterwave.com/..." }
```

---

### POST /payments/verify

**Auth required.** Manually verify a payment transaction.

**Body:**
```json
{ "transactionId": "12345678" }
```

---

### POST /payments/flutterwave/webhook

**Public.** Webhook endpoint for Flutterwave payment events. Verified via `verif-hash` header.

---

## Coupons

### GET /coupons/validate/:code

**Public.** Validate a coupon code.

**Response `200`:**
```json
{
  "code": "WELCOME10",
  "type": "PERCENTAGE",
  "value": "10",
  "minOrder": "50"
}
```

---

### GET /coupons

**Admin only.** List all coupons.

---

### POST /coupons

**Admin only.**

**Body:**
```json
{
  "code": "SUMMER15",
  "type": "PERCENTAGE",
  "value": 15,
  "minOrder": 500,
  "maxUses": 100,
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

---

### PATCH /coupons/:id

**Admin only.** Update coupon fields.

---

### DELETE /coupons/:id

**Admin only.** Delete a coupon.

---

## Reviews

### GET /reviews/product/:productId

**Public.** Get reviews for a product.

**Response `200`:**
```json
[
  {
    "id": "...",
    "rating": 5,
    "comment": "Great product!",
    "user": { "firstName": "John" },
    "createdAt": "..."
  }
]
```

---

### POST /reviews

**Auth required.**

**Body:**
```json
{
  "productId": "...",
  "rating": 4,
  "comment": "Very nice!",
  "orderId": "..."
}
```

---

### PATCH /reviews/:id

**Auth required.** Update own review.

**Body:**
```json
{ "rating": 5, "comment": "Updated review" }
```

---

### DELETE /reviews/:id

**Auth required.** Delete own review (admin can delete any).

---

## Newsletter

### POST /newsletter/subscribe

**Public.**

**Body:**
```json
{ "email": "user@example.com" }
```

---

### POST /newsletter/unsubscribe/:token

**Public.** Unsubscribe using the token from the unsubscribe email link.

---

## Admin

### GET /admin/stats

**Admin only.** Dashboard statistics.

**Response `200`:**
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
    "CANCELLED": 2
  },
  "recentOrders": [...],
  "topProducts": [...],
  "lowStockProducts": [...]
}
```

---

## Health

### GET /health

**Public.** Returns service health status.

**Response `200`:**
```json
{
  "status": "ok",
  "info": { "database": { "status": "up" } }
}
```

---

## Error Responses

| Status | Meaning |
|---|---|
| 400 | Validation error (malformed input) |
| 401 | Missing or invalid JWT token |
| 403 | Insufficient role |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate email, duplicate review) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

**Error shape:**
```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```
