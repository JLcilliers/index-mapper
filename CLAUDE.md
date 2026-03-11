# CLAUDE.md — Index Mapper

## Project Overview
Internal SEO agency tool for multi-client content mapping and index-bloat management.
Deployed on Vercel. Database on Neon PostgreSQL.

## Tech Stack
- Next.js 14+ (App Router)
- TypeScript (strict)
- Tailwind CSS + shadcn/ui
- Prisma ORM
- Neon PostgreSQL
- Zod validation
- TanStack Table
- NextAuth.js (credentials for MVP)

## Project Structure
```
src/
  app/           — Next.js App Router pages
  components/    — React components (ui/ for shadcn)
  lib/           — Shared utilities, db client, classification engine
  server/        — Server actions, data access layer
  types/         — TypeScript types and Zod schemas
prisma/          — Schema and migrations
docs/            — Architecture and planning docs
```

## Key Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to DB
npx prisma studio    # DB GUI
```

## Environment Variables
```
DATABASE_URL=        # Neon PostgreSQL connection string
NEXTAUTH_SECRET=     # Random secret for auth
NEXTAUTH_URL=        # http://localhost:3000 for dev
```

## Architecture Decisions
- CSV-first ingestion (no external API integrations in MVP)
- Classification engine uses hard rules + weighted scoring + manual review triggers
- Human overrides stored separately from machine recommendations
- All URL records scoped to a ProjectRun, which is scoped to a Client
- File parsing happens server-side via route handlers
- Large datasets handled with pagination and server-side filtering

## Conventions
- Use server actions for mutations
- Use route handlers for file uploads and heavy processing
- Keep classification logic in `src/lib/classification/`
- Keep CSV parsing logic in `src/lib/ingestion/`
- Use Zod schemas for all external data validation
- Prefer named exports
- Use barrel exports sparingly
