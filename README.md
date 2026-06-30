# Spark Dating App

A production-ready, scalable dating application built with Next.js 15, React, TypeScript, and clean architecture.

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion
- **Backend:** Next.js API Routes, Prisma ORM, PostgreSQL, JWT
- **Realtime:** Socket.io (Step 7)
- **Maps:** OpenStreetMap + Leaflet
- **Deployment:** Docker, Vercel, Railway

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (optional, for PostgreSQL & Redis)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start database services
npm run docker:up

# Generate Prisma client & push schema
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Health Check

```bash
curl http://localhost:3000/api/health
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Authentication routes
│   ├── (main)/             # Protected app routes
│   ├── api/                # API routes
│   └── ...
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Navbar, Footer, navigation
│   └── shared/             # Reusable components
├── features/               # Feature-based modules
│   ├── auth/
│   ├── profile/
│   ├── discovery/
│   ├── matching/
│   ├── chat/
│   ├── premium/
│   ├── admin/
│   └── landing/
├── hooks/
├── services/
├── store/
├── utils/
├── lib/
├── types/
├── providers/
└── middleware.ts
prisma/                     # Database schema
uploads/                    # Local file storage (dev)
docker-compose.yml          # PostgreSQL + Redis
```

## Authentication

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in (rate-limited) |
| POST | `/api/auth/logout` | Sign out & revoke session |
| POST | `/api/auth/refresh` | Rotate refresh token |
| GET | `/api/auth/me` | Get current user |

Tokens are stored in **HTTP-only cookies** (`spark_access_token`, `spark_refresh_token`).

- Access token: **15 minutes**
- Refresh token: **30 days** (with Remember Me) or **1 day**

### Pages

- `/login` — Email + password sign in
- `/register` — Full registration with terms acceptance
- `/signup` — Redirects to `/register`

### Usage

```tsx
import { useAuth } from "@/hooks/use-auth";

const { user, login, logout, register, isAuthenticated, loading } = useAuth();
```

## Profile Module

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get current user's profile |
| PUT | `/api/profile` | Update profile, interests, settings |
| POST | `/api/profile/photo` | Upload photo (multipart, max 6) |
| DELETE | `/api/profile/photo` | Delete photo by ID |
| PATCH | `/api/profile/photo/order` | Reorder photos & set primary |
| GET | `/api/interests` | List all interests |
| POST | `/api/location` | Update GPS / city / country |

### Pages

- `/profile` — View your profile
- `/profile/edit` — Full profile editor

### Setup

```bash
npm run db:push      # Apply schema changes
npm run db:seed      # Seed 189 interests
```

Photos are stored in `public/uploads/` during development.

## Discovery, Swipe & Match

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/discover` | Cursor-paginated discovery feed |
| POST | `/api/swipe` | Record LIKE, PASS, or SUPER_LIKE |
| GET | `/api/matches` | List active matches |
| GET | `/api/matches/:id` | Match detail with compatibility |
| GET/PUT | `/api/discovery/filters` | Read/update persisted filters |

### Pages

- `/discover` — Tinder-style swipe cards with filters, preview modal, and match animation

### Discovery rules

- ≥70% profile completion, active account, visible profile
- Excludes blocked, hidden, already-swiped, and self
- Gender preference, age, distance, and filter matching
- Rule-based compatibility score (0–100)
- Mutual LIKE/SUPER_LIKE creates exactly one match

### Test data

```bash
npm run db:seed:discovery   # 5 demo users near NYC
npx tsx scripts/test-discovery.ts   # API integration tests (dev server required)
```

## Deployment (Vercel)

See `production.env.example` for all required production variables.

### Quick deploy

1. Push to GitHub and import the repo in [Vercel](https://vercel.com)
2. Set environment variables from `production.env.example`
3. Use a hosted PostgreSQL database (Neon, Supabase, or Railway)
4. Run `npx prisma db push` against production `DATABASE_URL`
5. Deploy the socket server separately for realtime chat (Railway/Fly.io)

### Required production env

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Auth tokens (32+ chars) |
| `SMTP_*` / `EMAIL_FROM` | Gmail SMTP for verification & reset |
| `ADMIN_EMAILS` | Comma-separated admin emails |
| `NEXT_PUBLIC_APP_URL` | Public app URL |
| `SOCKET_EMIT_SECRET` | Secures socket `/emit` endpoint |

### Pre-launch checklist

```bash
npm run typecheck
npm run lint
npm run build
```

Test: registration, login, email verification, password reset, profile, photos, swiping, matching, chat, block, report, admin panel.

### Notes

- **Uploads:** Local `public/uploads` does not work on serverless. Use S3 or Cloudinary for production file storage.
- **Socket.io:** Runs as a separate process (`npm run dev:socket`). Not included in the default Vercel deployment.
- **Rate limits:** In-memory; use Redis for multi-instance production.

## Build Steps

| Step | Feature | Status |
|------|---------|--------|
| 1 | Project initialization | ✅ Complete |
| 2 | Authentication | ✅ Complete |
| 3 | Database & Profile | ✅ Complete |
| 4 | Discovery, Swipe & Match | ✅ Complete |
| 5 | Realtime Chat | ✅ Complete |
| 6 | V1 Launch (Security, Admin, Email) | ✅ Complete |
| 7 | Premium / Video / AI | Out of scope for V1 |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run dev:all` | Next.js + Socket.io |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | Run ESLint |
| `npm run docker:up` | Start PostgreSQL & Redis |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed:discovery` | Seed demo users for discovery |

## License

Private — All rights reserved.
