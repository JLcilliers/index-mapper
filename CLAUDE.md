# CLAUDE.md — Index Mapper

## Project Overview
Internal SEO agency tool for automated index-bloat analysis across 120+ client websites.
Crawl + GSC-driven indexability decision system. CSV upload retained as fallback only.
Deployed on Vercel. Database on Supabase PostgreSQL. Google OAuth for GSC access.

## Tech Stack
- Next.js 16 (App Router)
- TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui v4
- Prisma 6 + Supabase PostgreSQL
- Google OAuth 2.0 + Search Console API
- Internal crawler (fetch + cheerio)
- Zod validation, TanStack Table
- Fonts: Oswald (display/headings) + Roboto (body)
- Brand: Golden Proportions Marketing (purple/magenta/teal palette, 0 border-radius)

## Project Structure
```
src/
  app/           — Next.js App Router pages & API routes
  components/    — React components (ui/ for shadcn)
  lib/
    classification/ — Indexability decision engine
    ingestion/      — CSV parsing (fallback)
    crawler/        — Internal site crawler
    google/         — GSC API + OAuth
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
npx prisma db push   # Push schema to DB (uses DIRECT_URL)
npx prisma studio    # DB GUI
```

## Environment Variables
```
DATABASE_URL=             # Supabase Transaction Pooler (port 6543, ?pgbouncer=true)
DIRECT_URL=               # Supabase Session Pooler (port 5432, for migrations/DDL)
GOOGLE_CLIENT_ID=         # Google OAuth client ID
GOOGLE_CLIENT_SECRET=     # Google OAuth client secret
NEXT_PUBLIC_APP_URL=      # App URL (http://localhost:3000 or Vercel URL)
```

## Core Workflow
1. Add/select client → enter domain
2. Connect GSC property to client
3. Launch crawl → system crawls site automatically
4. Pull GSC page-level data for date range
5. Merge crawl + GSC data at URL level
6. Classify URLs for indexability (KEEP_INDEXED / KEEP_INDEXED_IMPROVE / CONSIDER_NOINDEX / MANUAL_REVIEW_REQUIRED)
7. Human reviewers validate edge cases
8. Export noindex recommendation documents

## Architecture Decisions
- Internal crawler (fetch + cheerio) — zero cost, full SEO field control
- Single Google account model for GSC (agency master account)
- Classification: 7-dimension weighted scoring + hard rules + review triggers
- Output: indexability recommendations, NOT content-mapping buckets
- System NEVER auto-noindexes — CONSIDER_NOINDEX requires human approval
- Human overrides stored separately from machine recommendations
- CSV upload preserved as fallback/enrichment only

## Conventions
- Use server actions for mutations
- Use route handlers for crawl, GSC fetch, file uploads, heavy processing
- Keep classification logic in `src/lib/classification/`
- Keep crawler in `src/lib/crawler/`
- Keep Google API code in `src/lib/google/`
- Keep CSV parsing in `src/lib/ingestion/`
- Use Zod schemas for all external data validation
- Prefer named exports
