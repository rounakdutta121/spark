# Database migrations

## Fresh database (production)

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

This applies the single baseline migration `20250630120000_baseline` that matches the current Prisma schema.

## Existing Neon database (already has tables)

If your database was created with `prisma db push` or older partial migrations, **do not** run `migrate deploy` blindly — it will fail because tables already exist.

**Option A — keep data (recommended for production with users):**

```bash
npx prisma migrate resolve --applied 20250630120000_baseline
```

This marks the baseline as applied without re-running SQL.

**Option B — reset (dev only, destroys data):**

```bash
npx prisma migrate reset
```

## Verify

```bash
npx prisma migrate status
```

Should show: `Database schema is up to date!`
