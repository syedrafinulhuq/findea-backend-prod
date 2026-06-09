# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌──────────────────────────────────────────────────────────────┐
│             Frontend — Next.js 16 (Vercel)                   │
│   Pages: product listing, product detail, cart, checkout,    │
│          orders, auth, profile, admin                        │
└───────────────────────────┬──────────────────────────────────┘
                            │ REST/JSON  (base: /api/v1)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│             Backend — NestJS 10 (Docker / VPS)               │
│   Port: 4000  │  Swagger: /docs  │  Health: /health          │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │   Auth   │ │ Products │ │  Orders  │ │   Payments     │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │   Cart   │ │ Wishlist │ │ Reviews  │ │   Coupons      │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│  │  Users   │ │  Admin   │ │Newsletter│                      │
│  └──────────┘ └──────────┘ └──────────┘                      │
│                    │ Prisma 7 + PrismaPg                      │
└────────────────────┼─────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌─────────────────┐   ┌──────────────────────┐
│  PostgreSQL 16  │   │      Redis 7          │
│  (main store)   │   │  (BullMQ job queue)  │
└─────────────────┘   └──────────────────────┘
                                │
                         ┌──────┴──────┐
                         ▼             ▼
                  ┌────────────┐ ┌──────────────┐
                  │Email (SMTP)│ │ Flutterwave  │
                  └────────────┘ └──────────────┘
```

## Technology Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | NestJS 10 |
| Language | TypeScript 5, Node.js 20 |
| ORM | Prisma 7 with PrismaPg driver adapter |
| Database | PostgreSQL 16 |
| Auth | Passport JWT, Argon2 password hashing |
| Job Queue | BullMQ 5 + Redis 7 |
| Payments | Flutterwave V3 API |
| Email | Nodemailer (SMTP) |
| Logging | Pino / nestjs-pino |
| Validation | class-validator, class-transformer |
| API Docs | Swagger / @nestjs/swagger |
| Rate Limiting | @nestjs/throttler |
| Health Checks | @nestjs/terminus |
| Cron | @nestjs/schedule |
| HTTP Security | Helmet |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 16 |
| Deployment | Vercel |

### Infrastructure
| Concern | Tool |
|---|---|
| Containers | Docker + Docker Compose |
| VPS deployment | `deploy.sh` (git pull → compose up → migrate) |
| Frontend hosting | Vercel |

## Request Lifecycle

```
Request
  → Helmet (security headers)
  → CORS validation
  → ThrottlerGuard (rate limit)
  → JwtAuthGuard (if protected)
  → RolesGuard (if admin-only)
  → ValidationPipe (DTO validation)
  → Controller
  → Service
  → Prisma → PostgreSQL
  → Response
```

## Module Dependency Graph

```
AppModule
├── ConfigModule (global, Joi-validated)
├── LoggerModule (global, Pino)
├── PrismaModule (global singleton)
├── MailModule
├── QueueModule → BullMQ → Redis
├── ScheduleModule
│
├── AuthModule → PrismaModule, MailModule, QueueModule
├── UsersModule → PrismaModule
├── ProductsModule → PrismaModule
├── OrdersModule → PrismaModule, QueueModule
├── PaymentsModule → PrismaModule, QueueModule
├── CartModule → PrismaModule
├── WishlistModule → PrismaModule
├── ReviewsModule → PrismaModule
├── CouponsModule → PrismaModule
├── NewsletterModule → PrismaModule, QueueModule
├── AdminModule → PrismaModule
├── JobsModule → PrismaModule, QueueModule
└── HealthModule → TerminusModule
```

## Data Flow: Order Creation

```
POST /orders
  → Validate JWT + CUSTOMER role
  → Validate DTO (items, shipping, coupon code)
  → Prisma.$transaction([
      1. Check product existence and stock for each item
      2. Validate and consume coupon (increment usedCount)
      3. Decrement product.stock for each item
      4. Create Order record
      5. Create OrderItem records (snapshot productName + unitPrice)
      6. Create Payment record (PENDING)
    ])
  → Queue email job: order-created
  → Return { orderNumber, checkoutUrl? }
```

## Data Flow: Payment Webhook

```
POST /payments/flutterwave/webhook
  → Verify verif-hash header using timingSafeEqual
  → Extract tx_ref from payload
  → Look up Payment by transactionRef
  → Verify transaction with Flutterwave API
  → Update Payment.status → SUCCESS / FAILED
  → Update Order.status → PAID (on success)
  → Queue job: payment-success
```
