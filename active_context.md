# Active Context — Index Mapper

## Current Phase
Phase 2 — Crawl strategy implementation + schema changes + classification refactor

## Product Pivot (v1 → v2)
The tool has been reframed from a CSV-first content mapping tool to a crawl + GSC-driven indexability decision system. See docs/indexability-mvp-reframe.md for the full pivot rationale.

## What Has Been Completed
- Phase 1: Full repo audit, product reframe, planning docs updated
  - docs/indexability-mvp-reframe.md — product pivot explanation
  - docs/crawl-strategy-analysis.md — crawl strategy decision (internal crawler chosen)
  - docs/gsc-integration-plan.md — GSC integration architecture
  - docs/classification-logic.md — new indexability classification system
  - docs/architecture.md — updated system architecture
  - docs/deployment.md — updated deployment guide
  - CLAUDE.md — updated project overview
- Brand styling applied: Oswald/Roboto fonts, GP purple/magenta/teal palette, 0 border-radius

## What Exists from v1 (Reusable)
- Prisma schema (Client, ProjectRun, UrlRecord, ReviewDecision, RuleConfig, UploadedFile)
- Classification engine (engine.ts, hard-rules.ts, scoring.ts, manual-review.ts, page-types.ts, defaults.ts)
- CSV ingestion pipeline (parser.ts, column-mapper.ts, normalizer.ts, merger.ts, derived-fields.ts)
- All UI components (dashboard, clients, runs, urls, settings)
- Server actions and queries
- API routes (upload, classify, export)
- Full shadcn/ui component library

## What Must Be Built (Phases 2-6)
### Phase 2 — Backend infrastructure
- [ ] Update Prisma schema (add GoogleConnection, gscProperty to Client, crawl fields)
- [ ] Refactor classification types (4 old buckets → 4 indexability recommendations)
- [ ] Update classification engine output mapping
- [ ] Build internal crawler (src/lib/crawler/)
- [ ] Add crawl API route

### Phase 3 — Google Search Console integration
- [ ] Google OAuth flow (src/lib/google/auth.ts)
- [ ] GSC API client (src/lib/google/search-console.ts)
- [ ] URL matching logic (src/lib/google/url-matching.ts)
- [ ] GSC property linking to clients
- [ ] GSC data pull API route

### Phase 4 — Merge and classification
- [ ] Merge crawl + GSC data at URL level
- [ ] Refactor classification engine for indexability output
- [ ] Update confidence and review trigger logic
- [ ] Add secondary action types

### Phase 5 — UI workflow refactor
- [ ] New run wizard (crawl → GSC → classify → review → export)
- [ ] Crawl progress screen
- [ ] GSC connection settings
- [ ] Updated URL table with indexability columns
- [ ] Updated review drawer
- [ ] Updated dashboard stats

### Phase 6 — Export and QA
- [ ] Noindex action sheet export
- [ ] URL list export
- [ ] Build verification
- [ ] End-to-end workflow test

## Key Technical Notes
- Using Prisma 6 with Supabase PostgreSQL
- Using shadcn/ui v4 with @base-ui/react (not Radix)
- Vercel Pro plan recommended for 300s function timeout (crawl batches)
- Internal crawler: fetch + cheerio, batch processing within serverless limits
- Single Google account model for GSC (agency master account)

## Deployment
- Vercel: https://index-mapper.vercel.app
- GitHub: https://github.com/JLcilliers/index-mapper
- Supabase: Project ID qiruefywvmktvgiqeigg (us-east-1)
