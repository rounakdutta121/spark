# Spark — Social Network

A modern social media platform built with Next.js 15, React 19, TypeScript, and PostgreSQL.

Share posts and stories, explore trending content, follow creators, and chat in real time.

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion
- **Backend:** Next.js API Routes, Prisma ORM, PostgreSQL (Neon)
- **Storage:** Appwrite Cloud (production) / local filesystem (dev)
- **Chat:** HTTP long polling (no Socket.io required)
- **Deployment:** Vercel + Neon + Appwrite

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (or Docker via `npm run docker:up`)

### Installation

```bash
npm install
cp .env.example .env
npm run docker:up          # optional — local Postgres
npm run db:generate
npm run db:push
npm run db:seed            # interests
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo content

```bash
npm run db:seed:social     # 12 demo profiles with posts
```

## Features

| Feature | Description |
|---------|-------------|
| **Feed** | Home feed from people you follow |
| **Explore** | Discover public posts |
| **Posts** | Photos, videos, captions, hashtags, likes, comments |
| **Stories** | 24-hour ephemeral content with reactions |
| **Chat** | DMs with text, images, audio, GIFs, read receipts |
| **Profiles** | Username, bio, photos, interests, follow/followers |
| **Notifications** | Likes, comments, follows, mentions |
| **Safety** | Block, mute, report, admin moderation |

## Project Structure

```
src/
├── app/              # Next.js App Router (pages + API)
├── components/       # Shared UI components
├── features/         # Feature modules (feed, chat, stories, …)
├── services/         # Business logic
├── lib/              # Utilities, auth, upload, prisma
└── middleware.ts     # Auth + security headers
prisma/               # Schema, migrations, seeds
```

## API Overview

| Area | Endpoints |
|------|-----------|
| Auth | `/api/auth/register`, `/login`, `/logout`, `/refresh`, `/me` |
| Feed | `/api/feed`, `/api/explore` |
| Posts | `/api/posts`, `/api/posts/[id]/like`, `/comments`, `/save` |
| Stories | `/api/stories` |
| Chat | `/api/conversations`, `/api/messages`, `/api/chat/poll` |
| Profile | `/api/profile`, `/api/users/[id]/profile` |
| Upload | `/api/upload/presign`, `/api/upload/file` |
| Admin | `/api/admin/*` |

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full Vercel + Neon + Appwrite guide.

```bash
npm run typecheck
npm run build
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed interests |
| `npm run db:seed:social` | Seed demo profiles & posts |

## License

Private — All rights reserved.
