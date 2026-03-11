# Architecture — Index Mapper v2

## System Overview

Index Mapper is a Next.js application deployed on Vercel with a Supabase PostgreSQL database. It serves as an internal SEO agency tool for automated indexability analysis across 120+ client websites.

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        Vercel                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                Next.js App Router                        │ │
│  │                                                          │ │
│  │  ┌──────────┐  ┌───────────┐  ┌───────────┐            │ │
│  │  │  Pages   │  │  Server   │  │  Route     │            │ │
│  │  │  (RSC)   │  │  Actions  │  │  Handlers  │            │ │
│  │  └────┬─────┘  └─────┬─────┘  └─────┬─────┘            │ │
│  │       │              │               │                   │ │
│  │  ┌────┴──────────────┴───────────────┴─────────────────┐ │ │
│  │  │              Service Layer                          │ │ │
│  │  │  ┌────────────┐ ┌──────────┐ ┌──────────────────┐  │ │ │
│  │  │  │  Crawler   │ │ GSC API  │ │ Classification   │  │ │ │
│  │  │  │  Engine    │ │ Client   │ │ Engine           │  │ │ │
│  │  │  └────────────┘ └──────────┘ └──────────────────┘  │ │ │
│  │  │  ┌────────────┐ ┌──────────┐ ┌──────────────────┐  │ │ │
│  │  │  │  CSV       │ │ URL      │ │ Export           │  │ │ │
│  │  │  │  Ingestion │ │ Matching │ │ Generator        │  │ │ │
│  │  │  └────────────┘ └──────────┘ └──────────────────┘  │ │ │
│  │  │                                                     │ │ │
│  │  │         Data Access Layer (Prisma + Zod)            │ │ │
│  │  └───────────────────────┬─────────────────────────────┘ │ │
│  └──────────────────────────┼───────────────────────────────┘ │
│                             │                                 │
└─────────────────────────────┼─────────────────────────────────┘
                              │
             ┌────────────────┴────────────────┐
             │                                  │
    ┌────────┴────────┐            ┌───────────┴──────────┐
    │ Supabase        │            │ Google APIs          │
    │ PostgreSQL      │            │ - Search Console     │
    └─────────────────┘            │ - OAuth 2.0          │
                                   └──────────────────────┘
```

## New Data Flow

### 1. Crawl Flow
1. User creates run → selects "Start Crawl"
2. Crawler fetches homepage, discovers internal links
3. Breadth-first crawl with configurable depth/page limits
4. Each page: extract SEO fields (title, H1, canonical, meta robots, word count, links)
5. Post-crawl: compute internal links IN, orphan detection, duplicate detection
6. Crawl results stored as UrlRecord entries

### 2. GSC Data Flow
1. User connects Google account (one-time OAuth)
2. User links GSC property to client
3. On run: pull page-level data for selected date range
4. Data: clicks, impressions, CTR, position per page URL
5. Normalize GSC URLs and match to crawled URLs
6. Merge GSC metrics into UrlRecord entries

### 3. Classification Flow (updated)
1. Load all UrlRecords for the run (crawl + GSC data merged)
2. Load RuleConfig (default or custom)
3. For each record:
   a. Check hard rules (short-circuit if match)
   b. Compute weighted scores across 7 dimensions
   c. Map score to indexability recommendation
   d. Check manual review triggers
   e. Compute confidence
   f. Generate reasons and action suggestions
4. Save results back to UrlRecords

### 4. Review Flow
1. User views URL table filtered by recommendation
2. Manual review queue: URLs flagged MANUAL_REVIEW_REQUIRED
3. User reviews signals, scoring, and reasoning
4. User approves or overrides recommendation
5. Override saved as ReviewDecision

### 5. Export Flow
1. Full review CSV: all URLs with complete data
2. Noindex action sheet: only approved noindex candidates
3. URL list: plain list of URLs to noindex
4. Grouped by page type or directory

## Key Architectural Decisions

### 1. Internal Crawler (not Firecrawl)
See docs/crawl-strategy-analysis.md for full rationale. Internal fetch+cheerio crawler chosen for zero per-crawl cost, full control over SEO field extraction, and suitability for WordPress/standard CMS sites that make up 95%+ of the client portfolio.

### 2. Batch Crawl Processing
Vercel serverless functions have timeout limits. Crawls are processed in batches — each API call processes a batch of URLs, frontend polls for progress. Queue-based architecture keeps each function invocation within limits.

### 3. Single Google Account Model
One agency Google account connects to the tool. This account has access to all client GSC properties. No per-user OAuth needed for an internal agency tool.

### 4. Classification Engine as Pure Logic
Preserved from v1. The classification engine is pure functions with no side effects. Takes UrlRecord + RuleConfig, returns IndexabilityResult. Testable, versionable, replaceable.

### 5. Separation of Machine and Human Decisions
Preserved from v1. UrlRecord stores machine recommendation. ReviewDecision stores human override. Final output computed by checking human override first, falling back to machine recommendation.

### 6. CSV Import as Fallback
CSV ingestion pipeline preserved for cases where:
- Client site can't be crawled (requires auth, etc.)
- User has Screaming Frog exports with richer data
- Supplementary data sources (backlinks, GA)

## File Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx                  # Dashboard
│   │   ├── clients/
│   │   │   ├── page.tsx              # Client list
│   │   │   └── [clientId]/
│   │   │       ├── page.tsx          # Client detail
│   │   │       └── runs/
│   │   │           └── [runId]/
│   │   │               └── page.tsx  # Run detail (crawl/GSC/URLs/review/export)
│   │   └── settings/
│   │       └── page.tsx              # Rules config + Google connection
│   ├── api/
│   │   ├── auth/google/              # Google OAuth callback
│   │   ├── crawl/                    # Crawl initiation and batch processing
│   │   ├── gsc/                      # GSC data fetch
│   │   ├── classify/                 # Classification trigger
│   │   ├── upload/                   # CSV upload (fallback)
│   │   └── export/                   # CSV/report export
│   └── layout.tsx
├── components/
│   ├── ui/                           # shadcn components
│   ├── layout/                       # Nav
│   ├── clients/                      # Client management
│   ├── runs/                         # Run management (crawl, upload, classify)
│   ├── urls/                         # URL table, detail drawer
│   └── dashboard/                    # Dashboard widgets
├── lib/
│   ├── db.ts                         # Prisma client singleton
│   ├── crawler/                      # Internal crawl engine
│   │   ├── crawler.ts                # Core crawl logic
│   │   ├── extractor.ts              # HTML → SEO field extraction
│   │   ├── queue.ts                  # Crawl queue management
│   │   └── robots.ts                 # robots.txt parser
│   ├── google/                       # Google API integration
│   │   ├── auth.ts                   # OAuth flow, token management
│   │   ├── search-console.ts         # GSC API client
│   │   └── url-matching.ts           # Normalize + match GSC URLs
│   ├── classification/               # Classification engine (preserved + updated)
│   │   ├── engine.ts                 # Main orchestrator
│   │   ├── hard-rules.ts             # Hard rule checks
│   │   ├── scoring.ts                # Weighted scoring
│   │   ├── manual-review.ts          # Review triggers
│   │   ├── page-types.ts             # Page type detection
│   │   └── defaults.ts               # Default rule config
│   ├── ingestion/                    # CSV parsing (preserved as fallback)
│   └── utils.ts
├── server/
│   ├── actions/
│   └── queries/
└── types/
    ├── index.ts
    └── schemas.ts
```
