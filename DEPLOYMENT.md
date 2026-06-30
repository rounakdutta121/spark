# Spark — Production Deployment (Neon + Appwrite + Vercel)

| Service | Role |
|---------|------|
| **Vercel** | Next.js app + API routes |
| **Neon** | PostgreSQL database |
| **Appwrite Cloud** | Photos, reels, story videos |
| **Upstash Redis** | Distributed rate limiting (recommended) |
| **Sentry** | Error monitoring (optional) |

---

## 1. Neon

1. Create project at [neon.tech](https://neon.tech)
2. Copy the **pooled** connection string
3. Apply migrations — see [prisma/MIGRATIONS.md](prisma/MIGRATIONS.md)

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

For existing DBs that already have tables:

```bash
npx prisma migrate resolve --applied 20250630120000_baseline
```

---

## 2. Appwrite Cloud Storage

1. Create project at [appwrite.io](https://appwrite.io)
2. **Storage** → bucket with **Any** → **Read** + **Create** permissions
3. **API Keys** → key with Storage read/write/delete scopes
4. Set `APPWRITE_BUCKET_ID` to your bucket ID

**Upload flow (production):**

- Files **≤ 4 MB**: `POST /api/upload/file` (through Vercel)
- Files **> 4 MB**: `POST /api/upload/presign` → client uploads **directly to Appwrite** (bypasses Vercel body limit, supports videos up to 100 MB)

---

## 3. Upstash Redis (rate limiting)

1. Create database at [upstash.com](https://upstash.com)
2. Copy REST URL + token to Vercel env

Without Upstash, rate limits use in-memory storage (not reliable across serverless instances).

---

## 4. Sentry (monitoring)

1. Create project at [sentry.io](https://sentry.io)
2. Set `SENTRY_DSN` in Vercel env

Optional: `SENTRY_ORG`, `SENTRY_PROJECT` for source maps.

---

## 5. Vercel environment variables

Copy from [production.env.example](production.env.example). Required:

```env
DATABASE_URL=
STORAGE_PROVIDER=appwrite
NEXT_PUBLIC_STORAGE_PROVIDER=appwrite
APPWRITE_ENDPOINT=
APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=
APPWRITE_BUCKET_ID=
JWT_SECRET=
JWT_REFRESH_SECRET=
NEXT_PUBLIC_APP_URL=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```

Recommended:

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
SENTRY_DSN=
ADMIN_EMAILS=
```

---

## 6. Deploy & verify

```bash
npm run build
```

**Smoke test checklist:**

- [ ] Register + verify email
- [ ] Post image (< 4 MB)
- [ ] Post video / story (> 4 MB, direct Appwrite upload)
- [ ] Chat send + receive (long poll)
- [ ] Profile photo upload
- [ ] Feed + explore load on mobile and desktop

---

## Chat

- Long polling via `GET /api/chat/poll` (8s timeout, Vercel Hobby compatible)
- Send via `POST /api/messages`
