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

echo "==> Checking if database needs seeding..."
ADMIN_COUNT=$($COMPOSE exec -T app node -e "
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
prisma.user.count({ where: { role: 'ADMIN' } }).then(c => { console.log(c); return prisma.\$disconnect(); });
" | tr -d '\r')

if [ "$ADMIN_COUNT" = "0" ]; then
  echo "==> No admin user found, seeding (idempotent — safe with existing data)..."
  $COMPOSE exec -T app node dist/prisma/seed.js
else
  echo "==> Admin user already exists ($ADMIN_COUNT), skipping seed."
fi

echo "==> Done! App is live."
$COMPOSE ps
