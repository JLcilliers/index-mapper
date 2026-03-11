# Active Context — Index Mapper

## Current Phase
Phase 3 — Google OAuth testing, GSC property selection UI, end-to-end crawl testing

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
- Phase 2: Backend infrastructure + schema + classification refactor (deployed)
  - Prisma schema: GoogleConnection, CrawlQueue, gscProperty on Client, crawl/GSC fields on ProjectRun, recommendation/secondaryAction on UrlRecord
  - Schema pushed to Supabase, database re-seeded with default-v2 rule config
  - Classification engine: outputs recommendation (not classification), adds secondaryAction, updated thresholds (keepIndexed: 65, keepIndexedImprove: 45)
  - Internal crawler: src/lib/crawler/ (extractor.ts, robots.ts, crawler.ts) — fetch+cheerio, BFS queue, robots.txt respect
  - Google integration: src/lib/google/ (auth.ts, search-console.ts, url-matching.ts) — OAuth 2.0 flow, GSC API client, URL normalization matching
  - API routes: /api/crawl (start/batch/finalize), /api/gsc (properties/fetch), /api/auth/google (OAuth flow + callback)
  - Updated API routes: /api/classify (recommendation output), /api/export (full/noindex/urls formats)
  - UI components: CrawlButton, GscFetchButton, updated run detail page with Crawl/Upload/URLs/Summary tabs
  - Updated: settings page, dashboard queries, client form, URL table, URL detail drawer, bucket summary
  - All old classification references migrated to recommendation
  - Build passes, deployed to Vercel, production smoke test passed

## What Must Be Built (Phases 3-6)
### Phase 3 — Google OAuth testing & GSC property UI
- [x] Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_APP_URL to Vercel env vars
- [x] Google Cloud project created: index-mapper-gsc (account: gpmsearchconsole@gmail.com)
- [x] OAuth consent screen configured (External, Testing mode)
- [x] OAuth 2.0 client created: "Index Mapper" (Web application)
- [x] Test user added: gpmsearchconsole@gmail.com
- [x] Redirect URIs: production callback + localhost callback
- [x] Redeployed to Vercel with new env vars
- [ ] Test Google OAuth flow end-to-end in production
- [ ] Add GSC connection status UI to settings page
- [ ] Add GSC property selector/dropdown when linking to client
- [ ] Test GSC data pull with a real client property

### Phase 4 — End-to-end workflow testing
- [ ] Test full crawl → GSC fetch → classify → review workflow
- [ ] Verify URL matching between crawl and GSC data
- [ ] Test classification engine with real data
- [ ] Test review drawer with recommendation overrides
- [ ] Verify export formats with real data

### Phase 5 — Polish & edge cases
- [ ] Create-run dialog: add crawl settings (maxPages, maxDepth)
- [ ] Error handling for crawl failures mid-batch
- [ ] Bulk review actions
- [ ] Dashboard: show recommendation distribution chart
- [ ] Handle GSC API rate limits gracefully

### Phase 6 — Final QA & production hardening
- [ ] End-to-end test with a real 120+ page client site
- [ ] Export verification (full report, noindex sheet, URL list)
- [ ] Performance testing with large URL sets
- [ ] Vercel function timeout handling for large crawls

## Key Technical Notes
- Using Prisma 6 with Supabase PostgreSQL
- Using shadcn/ui v4 with @base-ui/react (not Radix)
- Vercel Pro plan recommended for 300s function timeout (crawl batches)
- Internal crawler: fetch + cheerio, batch processing within serverless limits
- Single Google account model for GSC (agency master account)
- Google Cloud project: index-mapper-gsc (GCP), OAuth client ID: 300202867073-jm0qes2brtu08l10of63i755235e5i4d.apps.googleusercontent.com
- OAuth app in Testing mode — only gpmsearchconsole@gmail.com can authenticate (add more test users in GCP Audience page before going to production)

## Deployment
- Vercel: https://index-mapper.vercel.app
- GitHub: https://github.com/JLcilliers/index-mapper
- Supabase: Project ID qiruefywvmktvgiqeigg (us-east-1)
- Latest deploy: (2026-03-11) — Redeployed with Google OAuth env vars
