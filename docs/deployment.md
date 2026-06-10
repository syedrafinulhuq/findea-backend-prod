# Deployment

## Overview

| Component | Host | Method |
|---|---|---|
| Backend API | VPS (any Linux server) | Docker Compose |
| PostgreSQL | Same VPS (Docker) | Docker volume |
| Redis | Same VPS (Docker) | Docker volume |
| Frontend | Vercel | Git push / Vercel CLI |

---

## Backend — Docker Compose (Production)

### Prerequisites

- Docker and Docker Compose installed on the VPS
- Git access to the repository
- A `.env` file at `backend/.env` with production values

### First-Time Setup

```bash
# 1. SSH into the VPS
ssh user@your-server-ip

# 2. Clone the repository
git clone <repo-url> /opt/findea
cd /opt/findea

# 3. Create production environment file
cp backend/.env.example backend/.env
nano backend/.env   # fill in production values

# 4. Build and start
docker compose -f backend/docker-compose.prod.yml up --build -d

# 5. Verify containers are running
docker compose -f backend/docker-compose.prod.yml ps
```

The API will be available at `http://localhost:4000` on the VPS. Put a reverse proxy (nginx, Caddy, Traefik) in front to handle TLS and a public domain.

---

### Ongoing Deploys

Use the `deploy.sh` script at the project root:

```bash
./deploy.sh
```

This script:
1. `git pull` — pulls latest code
2. `docker compose up --build -d` — rebuilds and restarts containers
3. Waits 5 seconds for the app to start
4. `docker compose ps` — shows container status

Migrations run automatically on container start via the Dockerfile `CMD`:
```
npx prisma migrate deploy && node dist/src/main.js
```

---

### Manual Deploy Steps

```bash
cd /opt/findea

git pull

docker compose -f backend/docker-compose.prod.yml up --build -d

# If you need to run migrations manually
docker compose -f backend/docker-compose.prod.yml exec app npx prisma migrate deploy

# View logs
docker compose -f backend/docker-compose.prod.yml logs -f app
```

---

### docker-compose.prod.yml Services

| Service | Image | Port | Purpose |
|---|---|---|---|
| `postgres` | postgres:16 | internal | Primary database |
| `redis` | redis:7-alpine | internal | Job queue |
| `app` | (built from Dockerfile) | 127.0.0.1:4000 | NestJS API |

Port `4000` is bound to `127.0.0.1` only — not exposed to the public internet directly.

**Health checks:**
- PostgreSQL: `pg_isready` every 10s, 5 retries
- Redis: `redis-cli ping` every 10s, 5 retries
- App waits for both to be healthy before starting

---

### Dockerfile Build Stages

```
Stage 1: builder (node:20-alpine)
  - npm ci --ignore-scripts
  - npx prisma generate
  - npx nest build → ./dist

Stage 2: runner (node:20-alpine)
  - NODE_ENV=production
  - npm ci --omit=dev
  - Copy: dist/, prisma/, node_modules/.prisma/
  - CMD: npx prisma migrate deploy && node dist/src/main.js
```

---

## Reverse Proxy (nginx example)

```nginx
server {
    listen 80;
    server_name api.findea.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.findea.com;

    ssl_certificate     /etc/letsencrypt/live/api.findea.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.findea.com/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

---

## Frontend — Vercel

The frontend is deployed automatically by Vercel on push to `main`. Configuration is in `vercel.json` at the repo root.

For manual deployment:
```bash
cd frontend
vercel --prod
```

Set the following environment variable in the Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://api.findea.com/api
```

---

## Environment Variables Checklist (Production)

Before deploying, ensure these are set in `backend/.env`:

- [ ] `DATABASE_URL` — points to the Docker postgres service: `postgresql://user:pass@postgres:5432/findea`
- [ ] `JWT_ACCESS_SECRET` — 32+ random characters
- [ ] `JWT_REFRESH_SECRET` — 32+ random characters, different from access secret
- [ ] `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` — production email provider
- [ ] `CORS_ORIGINS` — your frontend domain(s)
- [ ] `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_PUBLIC_KEY`, `FLUTTERWAVE_ENCRYPTION_KEY`
- [ ] `FLUTTERWAVE_WEBHOOK_HASH`
- [ ] `REDIS_PASSWORD` — if Redis is password-protected

---

## Useful Docker Commands

```bash
# View logs
docker compose -f backend/docker-compose.prod.yml logs -f app

# Restart app only
docker compose -f backend/docker-compose.prod.yml restart app

# Enter app container shell
docker compose -f backend/docker-compose.prod.yml exec app sh

# Run Prisma studio (dev only)
docker compose -f backend/docker-compose.yml exec app npx prisma studio

# Stop everything
docker compose -f backend/docker-compose.prod.yml down

# Stop and remove volumes (DESTRUCTIVE — deletes database)
docker compose -f backend/docker-compose.prod.yml down -v
```

---

## Database Backup

```bash
# Backup
docker compose -f backend/docker-compose.prod.yml exec postgres \
  pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d).sql

# Restore
docker compose -f backend/docker-compose.prod.yml exec -T postgres \
  psql -U $POSTGRES_USER $POSTGRES_DB < backup_20240615.sql
```
