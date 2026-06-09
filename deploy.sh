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
$COMPOSE exec app npx prisma migrate deploy

echo "==> Done! App is live."
$COMPOSE ps
