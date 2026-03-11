# Product Pivot: Content Mapping → Indexability Decision System

## What Changed

The original Index Mapper was built as a **CSV-first content mapping tool** with a four-bucket classification system (keep, improve, redirect, remove). Users uploaded Screaming Frog exports, GSC exports, and backlink CSVs manually, and the tool scored and classified URLs into those four buckets.

The product is now pivoting to a **crawl + GSC-driven indexability decision system**. The core question is no longer "what bucket does this content fall into?" but rather: **"Should this page remain indexed?"**

## Why This Matters

Golden Proportions Marketing manages 120+ client websites. Index bloat — too many low-value pages in Google's index — is a systemic problem across these portfolios. The old workflow required:

1. Running Screaming Frog manually per client
2. Exporting GSC data manually per client
3. Uploading multiple CSVs into the tool
4. Running classification
5. Reviewing results

This doesn't scale to 120+ clients. The new system must automate steps 1-4.

## New Primary Workflow

1. Add/select client → enter domain
2. Connect Google Search Console property
3. Launch automated crawl
4. System crawls site and builds URL inventory
5. System pulls GSC page-level data (clicks, impressions, CTR, position)
6. System merges crawl + GSC data at the URL level
7. Classification engine evaluates each URL for indexability
8. Manual review queue surfaces edge cases
9. Export implementation-ready noindex documents

## New Classification Output

### Primary Recommendation (replaces old four-bucket system)

| Recommendation | Meaning |
|---|---|
| KEEP_INDEXED | Page should remain in the index |
| KEEP_INDEXED_IMPROVE | Page should remain indexed but needs content/technical improvements |
| CONSIDER_NOINDEX | System recommends noindexing this page |
| MANUAL_REVIEW_REQUIRED | Conflicting signals — human must decide |

### Secondary Action Types (optional detail)

- improve_content
- consolidate_pages
- redirect_to_target
- canonicalize
- noindex_only
- review_internally
- investigate_tracking
- preserve_legal_trust

## What Gets Preserved from v1

- **Classification engine architecture**: The 7-dimensional scoring system, hard rules, manual review triggers, and page type detection are all reusable. The scoring functions remain the same — only the output mapping changes.
- **CSV ingestion pipeline**: Retained as fallback/enrichment. Parser, column mapper, normalizer, merger, derived fields all stay.
- **Prisma schema pattern**: Client → ProjectRun → UrlRecord relationship is preserved and extended.
- **UI component library**: All shadcn/ui components, layout, nav, cards, tables, dialogs remain.
- **Server action/query patterns**: CRUD and filter patterns are reused.

## What Changes from v1

- **Data acquisition**: Primary path shifts from CSV upload to automated crawl + GSC API
- **Classification labels**: Four content buckets → four indexability recommendations
- **Schema**: New models for GSC properties, crawl runs, Google auth connections
- **Run workflow**: New multi-step wizard (crawl → GSC → merge → classify → review → export)
- **Export formats**: New noindex-specific action sheets and implementation files
- **Authentication**: Google OAuth added for GSC access (no internal app auth in MVP)
