# Findea — Documentation Index

Findea is a full-stack e-commerce platform for fashion products. The backend is a NestJS REST API deployed via Docker; the frontend is a Next.js application deployed separately on Vercel.

## Contents

| Document | Description |
|---|---|
| [Architecture](./architecture.md) | System design, tech stack, data flow |
| [Getting Started](./getting-started.md) | Local development setup |
| [Configuration](./configuration.md) | Environment variables reference |
| [API Reference](./api-reference.md) | All endpoints, request/response shapes |
| [Database](./database.md) | Prisma schema, models, migrations |
| [Authentication](./authentication.md) | JWT flow, roles, guards |
| [Deployment](./deployment.md) | Docker, VPS, Vercel deployment |
| **Modules** | |
| [Auth](./modules/auth.md) | Registration, login, password reset |
| [Users](./modules/users.md) | Profile, addresses, password change |
| [Products](./modules/products.md) | Catalog, filtering, categories, images |
| [Orders](./modules/orders.md) | Order creation, lifecycle, tracking |
| [Payments](./modules/payments.md) | Flutterwave integration, webhooks |
| [Cart](./modules/cart.md) | Shopping cart management |
| [Wishlist](./modules/wishlist.md) | Wishlist management |
| [Reviews](./modules/reviews.md) | Product reviews and ratings |
| [Coupons](./modules/coupons.md) | Discount codes |
| [Newsletter](./modules/newsletter.md) | Email subscriptions |
| [Admin](./modules/admin.md) | Admin stats and management |
| [Jobs & Queue](./modules/jobs-queue.md) | Background jobs, email queue, cron tasks |

## Quick Links

- **Swagger UI** (when running locally): `http://localhost:4000/docs`
- **Health check**: `GET /health`
- **API base path**: `/api`
