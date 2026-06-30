#!/bin/bash
set -e

COMPOSE="docker compose -f backend/docker-compose.prod.yml"

echo "==> Pulling latest changes..."
git pull

echo "==> Building and restarting containers..."
$COMPOSE up --build -d

echo "==> Waiting for app to be healthy..."
sleep 5

echo "==> Running database migrations..."
$COMPOSE exec -T app npx prisma migrate deploy

echo "==> Checking database state before seeding..."
PRE=$($COMPOSE exec -T app node -e "
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
Promise.all([
  prisma.user.count({ where: { role: 'ADMIN' } }),
  prisma.product.count(),
  prisma.coupon.count(),
]).then(([a, p, c]) => { console.log(a + ' ' + p + ' ' + c); return prisma.\$disconnect(); });
" | tr -d '\r')
PRE_ADMINS=$(echo $PRE | awk '{print $1}')
PRE_PRODUCTS=$(echo $PRE | awk '{print $2}')
PRE_COUPONS=$(echo $PRE | awk '{print $3}')
echo "     Before → admins: $PRE_ADMINS  |  products: $PRE_PRODUCTS  |  coupons: $PRE_COUPONS"

echo "==> Running seed (all upserts — nothing is duplicated or overwritten)..."
$COMPOSE exec -T app node dist/prisma/seed.js

echo "==> Verifying database state after seeding..."
POST=$($COMPOSE exec -T app node -e "
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
Promise.all([
  prisma.user.count({ where: { role: 'ADMIN' } }),
  prisma.product.count(),
  prisma.coupon.count(),
]).then(([a, p, c]) => { console.log(a + ' ' + p + ' ' + c); return prisma.\$disconnect(); });
" | tr -d '\r')
POST_ADMINS=$(echo $POST | awk '{print $1}')
POST_PRODUCTS=$(echo $POST | awk '{print $2}')
POST_COUPONS=$(echo $POST | awk '{print $3}')
echo "     After  → admins: $POST_ADMINS  |  products: $POST_PRODUCTS  |  coupons: $POST_COUPONS"

NEW_ADMINS=$(( POST_ADMINS - PRE_ADMINS ))
NEW_PRODUCTS=$(( POST_PRODUCTS - PRE_PRODUCTS ))
NEW_COUPONS=$(( POST_COUPONS - PRE_COUPONS ))

echo ""
echo "==> Seed summary:"
[ "$NEW_ADMINS"   -gt 0 ] && echo "     + $NEW_ADMINS admin(s) created"   || echo "     ✓ admins   — already up to date ($POST_ADMINS)"
[ "$NEW_PRODUCTS" -gt 0 ] && echo "     + $NEW_PRODUCTS product(s) added"  || echo "     ✓ products — already up to date ($POST_PRODUCTS)"
[ "$NEW_COUPONS"  -gt 0 ] && echo "     + $NEW_COUPONS coupon(s) added"    || echo "     ✓ coupons  — already up to date ($POST_COUPONS)"
echo ""

echo "==> Done! App is live."
$COMPOSE ps
