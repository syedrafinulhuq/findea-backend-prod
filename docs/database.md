# Database

## Overview

- **Engine:** PostgreSQL 16
- **ORM:** Prisma 7 with `@prisma/adapter-pg` (native driver adapter)
- **Schema file:** `backend/prisma/schema.prisma`
- **Migrations:** `backend/prisma/migrations/`

---

## Enums

| Enum | Values |
|---|---|
| `Role` | `CUSTOMER`, `ADMIN` |
| `OrderStatus` | `PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED` |
| `PaymentStatus` | `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED` |
| `CouponType` | `PERCENTAGE`, `FIXED` |
| `ProductType` | `PRODUCT`, `SERVICE`, `BOUTIQUE`, `REGISTRY` |
| `DeliveryMethod` | `DELIVERY`, `PICKUP` |
| `PaymentMethod` | `WAVE`, `ORANGE`, `MTN`, `PICKUP` |

---

## Models

### User

Stores customer and admin accounts.

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `email` | String | Unique |
| `passwordHash` | String | Argon2 hash |
| `firstName` | String | |
| `lastName` | String | |
| `phone` | String? | Optional |
| `role` | Role | Default: `CUSTOMER` |
| `refreshTokenHash` | String? | Argon2-hashed refresh token |
| `passwordResetToken` | String? | Hashed OTP |
| `passwordResetExpires` | DateTime? | OTP expiry |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

Relations: `addresses`, `orders`, `cart` (1-to-1), `wishlistItems`, `reviews`

---

### Address

Shipping and billing addresses for users. Multiple per user.

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `userId` | String | FK → User |
| `label` | String | e.g. "Home", "Office" |
| `line1` | String | |
| `line2` | String? | |
| `city` | String | |
| `state` | String | |
| `postalCode` | String | |
| `country` | String | Default: `Bangladesh` |
| `isDefault` | Boolean | Default: false |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

Index: `userId`

---

### Category

Product category with URL-friendly slug.

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `name` | String | Unique |
| `slug` | String | Unique |
| `createdAt` | DateTime | |

---

### Product

Core product entity.

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `name` | String | |
| `slug` | String | Unique |
| `description` | String | |
| `price` | Decimal | Avoids float precision loss |
| `stock` | Int | |
| `imageUrl` | String | Primary image |
| `categoryId` | String? | FK → Category (optional) |
| `brand` | String? | |
| `type` | ProductType | Default: `PRODUCT` |
| `location` | String? | |
| `isBooked` | Boolean | Default: false |
| `isActive` | Boolean | Default: true (soft delete) |
| `lowStockAlert` | Boolean | Default: false |
| `avgRating` | Float | Default: 0, recalculated on review mutations |
| `reviewCount` | Int | Default: 0, recalculated on review mutations |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

Relations: `category`, `orderItems`, `cartItems`, `wishlistItems`, `images`, `reviews`

---

### ProductImage

Gallery images for a product.

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `productId` | String | FK → Product (cascade delete) |
| `url` | String | Image URL |
| `position` | Int | Display order, default 0 |

---

### Order

Customer order.

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `orderNumber` | String | Unique, human-readable (e.g. `ORD-20240101-A3X9`) |
| `userId` | String? | FK → User (null = guest order) |
| `customerEmail` | String | Snapshot at time of order |
| `customerName` | String | |
| `customerPhone` | String | |
| `shippingLine1` | String | |
| `shippingLine2` | String? | |
| `shippingCity` | String | |
| `shippingState` | String | |
| `shippingCountry` | String | Default: `Bangladesh` |
| `deliveryMethod` | DeliveryMethod | `DELIVERY` \| `PICKUP`, default: `DELIVERY` |
| `deliveryNotes` | String? | Landmark / delivery instructions |
| `paymentMethod` | PaymentMethod? | `WAVE` \| `ORANGE` \| `MTN` \| `PICKUP` — metadata only |
| `subtotal` | Decimal | Sum of line items |
| `deliveryFee` | Decimal | Default: 0 |
| `discountAmount` | Decimal | Default: 0 |
| `total` | Decimal | subtotal + deliveryFee - discountAmount |
| `couponId` | String? | FK → Coupon |
| `trackingNumber` | String? | Shipping tracking |
| `status` | OrderStatus | Default: `PENDING` |
| `cancelReason` | String? | |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

Indexes: `userId`, `customerEmail`, `status`

---

### OrderItem

Immutable snapshot of a product at time of order.

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `orderId` | String | FK → Order |
| `productId` | String | FK → Product |
| `productName` | String | Snapshot (product name may change) |
| `quantity` | Int | |
| `unitPrice` | Decimal | Snapshot price |

Index: `productId`

---

### Payment

Flutterwave payment record.

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `orderId` | String | FK → Order (cascade delete), unique |
| `amount` | Decimal | |
| `currency` | String | Default: `BDT` |
| `status` | PaymentStatus | Default: `PENDING` |
| `provider` | String | Default: `flutterwave` |
| `transactionRef` | String | Unique, generated tx_ref |
| `flutterwaveTxId` | String? | Flutterwave transaction ID |
| `checkoutUrl` | String? | Redirect URL for payment |
| `rawResponse` | Json? | Full Flutterwave response |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

---

### Cart

One cart per user (1-to-1 with User).

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `userId` | String | FK → User (unique) |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

---

### CartItem

Item in a user's cart.

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `cartId` | String | FK → Cart |
| `productId` | String | FK → Product |
| `quantity` | Int | Default: 1 |
| `addedAt` | DateTime | |

Unique constraint: `(cartId, productId)` — one entry per product per cart.  
Index: `cartId`

---

### WishlistItem

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `userId` | String | FK → User |
| `productId` | String | FK → Product |
| `addedAt` | DateTime | |

Unique constraint: `(userId, productId)` — prevents duplicates.  
Index: `userId`

---

### Coupon

Discount code.

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `code` | String | Unique (case-sensitive) |
| `type` | CouponType | `PERCENTAGE` or `FIXED` |
| `value` | Decimal | Percent or fixed amount |
| `minOrder` | Decimal? | Minimum order total to apply |
| `maxUses` | Int? | Max redemptions (null = unlimited) |
| `usedCount` | Int | Default: 0 |
| `expiresAt` | DateTime? | Expiry date (null = never) |
| `isActive` | Boolean | Default: true |
| `createdAt` | DateTime | |

---

### Review

Product review by a customer.

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `userId` | String | FK → User |
| `productId` | String | FK → Product |
| `orderId` | String? | FK → Order (optional) |
| `rating` | Int | 1–5 |
| `comment` | String | |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

Unique constraint: `(userId, productId)` — one review per user per product.  
Index: `productId`

After any create/update/delete on a Review, `Product.avgRating` and `Product.reviewCount` are recalculated.

---

### NewsletterSubscriber

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `email` | String | Unique |
| `unsubscribeToken` | String | Unique, sent in unsubscribe emails |
| `createdAt` | DateTime | |

---

## Migrations

Located at `backend/prisma/migrations/`.

| Migration | Changes |
|---|---|
| `20260501153805_init` | Initial schema: User, Address, Category, Product, Order, OrderItem, Payment, NewsletterSubscriber |
| `20260605000000_add_cart_wishlist_coupon_review_gallery` | Adds Cart, CartItem, WishlistItem, Coupon, ProductImage, Review; extends Order and Product |
| `20260609190445_add_product_brand_avg_rating` | Adds `Product.brand`, `Product.avgRating`, `Product.reviewCount` |
| `20260609192728_add_product_type_location_isbooked` | Adds `ProductType` enum, `Product.type`, `Product.location`, `Product.isBooked` |
| `20260612194317_add_delivery_and_payment_method_to_order` | Adds `DeliveryMethod` and `PaymentMethod` enums, `Order.deliveryMethod`, `Order.deliveryNotes`, `Order.paymentMethod` |

### Running Migrations

**Development** (creates a new migration file):
```bash
cd backend
npm run prisma:migrate -- --name describe_your_change
```

**Production** (applies existing migrations without creating new ones):
```bash
npm run prisma:deploy
# or inside Docker
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

### Seeding

```bash
cd backend
npm run seed
```
