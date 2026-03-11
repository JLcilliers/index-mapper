# Active Context — Index Mapper

## Current Phase
Phase 5 — QA and Deployment Readiness

## What Has Been Completed
- Phase 1: All planning docs created (architecture, classification-logic, data-ingestion, data-model, mvp-scope, deployment)
- Phase 2: Next.js project initialized with TypeScript, Tailwind, shadcn/ui v4, Prisma 6, NextAuth
- Phase 3: Complete backend implemented:
  - Prisma schema with all models (User, Client, ProjectRun, UploadedFile, UrlRecord, ReviewDecision, RuleConfig)
  - CSV ingestion pipeline (parser, column-mapper, normalizer, merger, derived-fields)
  - Classification engine (hard-rules, scoring, manual-review, page-types, engine)
  - API routes for upload, classify, export
  - Server actions for clients, runs, reviews
  - Query layer for clients, runs, URLs with pagination/filtering
- Phase 4: Complete frontend implemented:
  - Dashboard with stats cards, bucket summary, recent runs
  - Client list with CRUD
  - Client detail with run management
  - Run detail with upload, URL table, summary tabs
  - URL mapping table with filters, pagination, search
  - URL detail drawer with scoring breakdown and review override
  - Settings page showing classification config
  - Auth (sign-in page, protected routes)
- Phase 5: Build passes cleanly (TypeScript + compilation)

## Current Blockers
- Need database connection to test full workflow
- Need to verify seed script works

## Next Immediate Task
- Set up Neon database and test end-to-end
- Or verify .env.example and deployment docs are solid
- Prepare GitHub-ready repo

## Key Technical Notes
- Using Prisma 6 (not 7) due to adapter requirement changes in v7
- Using shadcn/ui v4 which uses @base-ui/react instead of Radix
- `asChild` prop replaced with `render` prop in base-ui components
- Select onValueChange returns `string | null` (not just `string`)
