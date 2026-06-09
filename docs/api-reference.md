# API Reference

**Base URL:** `/api/v1`  
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
| `category` | string | Category slug |
| `brand` | string | Brand name (case-insensitive) |
| `type` | `PRODUCT\|SERVICE\|BOUTIQUE\|REGISTRY` | Product type |
| `location` | string | Location filter |
| `minPrice` | number | Minimum price |
| `maxPrice` | number | Maximum price |
| `minRating` | number | Minimum average rating (0–5) |
| `inStock` | boolean | Only products with stock > 0 |
| `isBooked` | boolean | Filter by booking status |
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

**Auth required.**

Create a new order.

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
  "shippingCity": "Dhaka",
  "shippingState": "Dhaka Division",
  "shippingCountry": "Bangladesh",
  "couponCode": "WELCOME10",
  "deliveryFee": 60
}
```

**Response `201`:**
```json
{
  "orderNumber": "ORD-20240615-A3X9",
  "total": "4050.00",
  "status": "PENDING"
}
```

---

### GET /orders/mine

**Auth required.** Returns the current user's orders, paginated.

**Query:** `page`, `limit`

---

### GET /orders/track/:orderNumber

Track order by order number. Requires `?email=customer@email.com`.

---

### PATCH /orders/:orderNumber/status

**Admin only.**

**Body:**
```json
{ "status": "SHIPPED", "trackingNumber": "BD123456789" }
```

---

### POST /orders/:orderNumber/cancel

**Auth required.** Cancel a PENDING order.

**Body:**
```json
{ "reason": "Changed my mind" }
```

---

### POST /orders/:orderNumber/refund

**Admin only.** Mark order as refunded.

---

### GET /orders

**Admin only.** List all orders with filters.

**Query:** `page`, `limit`, `status`, `search`

---

## Payments

### POST /payments/initialize

**Auth required.** Initiate payment for an order.

**Body:**
```json
{ "orderNumber": "ORD-20240615-A3X9" }
```

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
