# Getting Started

## Prerequisites

- Node.js 20+
- Docker + Docker Compose
- pnpm (or npm)
- Git

## Local Development Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd findea
```

### 2. Start Infrastructure (Postgres + Redis)

```bash
cd backend
docker compose up -d
```

This starts:
- PostgreSQL 16 on port `5433` (mapped from container 5432)
- Redis 7 on port `6379`

### 3. Configure Environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and fill in at minimum:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/findea?schema=public
JWT_ACCESS_SECRET=your-32-char-secret-here
JWT_REFRESH_SECRET=your-other-32-char-secret-here
SMTP_HOST=smtp.example.com
SMTP_USER=your@email.com
SMTP_PASS=yourpassword
```

### 4. Install Dependencies

```bash
cd backend
npm install
```

### 5. Run Migrations and Seed

```bash
npm run prisma:migrate -- --name init
npm run seed
```

Seed creates:
- 4 users (1 admin, 3 customers) — see [seed credentials](#seed-credentials)
- 5 categories, 24 products
- 4 discount coupons

### 6. Start the API Server

```bash
npm run start:dev
```

The API runs at `http://localhost:4000`.  
Swagger UI is available at `http://localhost:4000/docs`.

---

## Seed Credentials

| Email | Password | Role |
|---|---|---|
| admin@fidea.com | Admin@12345 | ADMIN |
| sarah@example.com | Customer@12345 | CUSTOMER |
| james@example.com | Customer@12345 | CUSTOMER |
| demo@example.com | Customer@12345 | CUSTOMER |

---

## NPM Scripts

| Script | Description |
|---|---|
| `npm run start:dev` | Start with watch mode |
| `npm run build` | Generate Prisma client + compile TypeScript |
| `npm run start:prod` | Run compiled output |
| `npm run prisma:migrate` | Run dev migration |
| `npm run prisma:deploy` | Apply migrations (production) |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run seed` | Seed the database |

---

## Project Structure

```
backend/
├── src/
│   ├── admin/           Admin stats
│   ├── auth/            JWT auth, registration, password reset
│   ├── cart/            Shopping cart
│   ├── common/          Guards, decorators, enums, interfaces
│   ├── coupons/         Discount coupon management
│   ├── health/          Health check endpoint
│   ├── jobs/            Cron jobs (auto-cancel orders, low-stock)
│   ├── mail/            Nodemailer SMTP service
│   ├── newsletter/      Newsletter subscriptions
│   ├── orders/          Order lifecycle
│   ├── payments/        Flutterwave integration
│   ├── prisma/          Prisma service singleton
│   ├── products/        Product catalog
│   ├── queue/           BullMQ processors
│   ├── reviews/         Product reviews
│   ├── users/           User profile and addresses
│   ├── wishlist/        Wishlist
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── prisma.config.ts
├── Dockerfile
├── docker-compose.yml       (dev)
├── docker-compose.prod.yml  (production)
└── .env.example
```
