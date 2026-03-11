# Architecture — Index Mapper

## System Overview

Index Mapper is a Next.js application deployed on Vercel with a Neon PostgreSQL database. It serves as an internal SEO agency tool for classifying URLs across 120+ client websites into action buckets.

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                   Vercel                         │
│  ┌─────────────────────────────────────────────┐ │
│  │           Next.js App Router                │ │
│  │                                             │ │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────┐ │ │
│  │  │  Pages   │  │  Server   │  │  Route    │ │ │
│  │  │  (RSC)   │  │  Actions  │  │  Handlers │ │ │
│  │  └────┬─────┘  └─────┬─────┘  └────┬─────┘ │ │
│  │       │              │              │       │ │
│  │  ┌────┴──────────────┴──────────────┴─────┐ │ │
│  │  │           Data Access Layer            │ │ │
│  │  │          (Prisma + Zod)                │ │ │
│  │  └────────────────┬───────────────────────┘ │ │
│  └───────────────────┼─────────────────────────┘ │
│                      │                           │
└──────────────────────┼───────────────────────────┘
                       │
              ┌────────┴────────┐
              │  Neon PostgreSQL │
              └─────────────────┘
```

## Key Architectural Decisions

### 1. Server-Side Processing for CSV Ingestion
CSV files are uploaded via route handlers. Parsing, normalization, and classification happen server-side. This avoids shipping large datasets to the client and keeps the classification engine secure.

### 2. Classification Engine as Pure Logic
The classification engine (`src/lib/classification/`) is implemented as pure functions with no side effects. This makes it testable, versionable, and replaceable. It takes a URL record + rule config and returns a classification result.

### 3. Separation of Machine and Human Decisions
The `UrlRecord` stores the machine-generated classification. The `ReviewDecision` stores human overrides. The final action is computed by checking for a review override first, then falling back to the machine classification. This preserves audit trails.

### 4. Rule Config as Data
Classification rules (weights, thresholds, hard rules) are stored in the database as JSON configs. This allows per-client or per-run customization without code changes.

### 5. Pagination and Server-Side Filtering
URL mapping tables use server-side pagination and filtering. A single client could have 50,000+ URLs. We never load all records into client memory.

### 6. File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── sign-in/
│   ├── (dashboard)/
│   │   ├── page.tsx                  # Dashboard
│   │   ├── clients/
│   │   │   ├── page.tsx              # Client list
│   │   │   └── [clientId]/
│   │   │       ├── page.tsx          # Client detail
│   │   │       └── runs/
│   │   │           └── [runId]/
│   │   │               ├── page.tsx  # Run detail / mapping table
│   │   │               ├── upload/
│   │   │               ├── review/
│   │   │               └── export/
│   │   └── settings/
│   ├── api/
│   │   ├── auth/
│   │   ├── upload/
│   │   └── classify/
│   └── layout.tsx
├── components/
│   ├── ui/                           # shadcn components
│   ├── layout/                       # Shell, nav, sidebar
│   ├── clients/                      # Client-specific components
│   ├── runs/                         # Run-specific components
│   ├── urls/                         # URL table, detail drawer
│   └── dashboard/                    # Dashboard widgets
├── lib/
│   ├── db.ts                         # Prisma client singleton
│   ├── auth.ts                       # NextAuth config
│   ├── classification/
│   │   ├── engine.ts                 # Main classification orchestrator
│   │   ├── hard-rules.ts             # Hard rule checks
│   │   ├── scoring.ts                # Weighted scoring
│   │   ├── manual-review.ts          # Manual review trigger checks
│   │   ├── page-types.ts             # Page type detection
│   │   └── types.ts                  # Classification types
│   ├── ingestion/
│   │   ├── parser.ts                 # CSV parsing
│   │   ├── normalizer.ts             # URL and field normalization
│   │   ├── column-mapper.ts          # Header detection and mapping
│   │   ├── merger.ts                 # Record merging by URL
│   │   └── derived-fields.ts         # Computed fields
│   └── utils.ts                      # General utilities
├── server/
│   ├── actions/                      # Server actions
│   └── queries/                      # Data fetching functions
└── types/
    ├── index.ts                      # Shared types
    └── schemas.ts                    # Zod schemas
```

## Data Flow

### Import Flow
1. User uploads CSV files → Route handler
2. Files parsed with Papa Parse → Raw rows
3. Column mapper identifies fields → Mapped rows
4. Normalizer cleans URLs and values → Normalized rows
5. Merger combines by canonical URL → Merged records
6. Derived fields computed → Enriched records
7. Records saved to database → UrlRecord rows

### Classification Flow
1. Load UrlRecords for a run
2. Load RuleConfig (default or custom)
3. For each record:
   a. Check hard rules (short-circuit if match)
   b. Compute weighted scores across dimensions
   c. Determine classification bucket
   d. Compute confidence score
   e. Check manual review triggers
   f. Generate reasons
4. Save classifications back to UrlRecords

### Review Flow
1. User filters URL table
2. User clicks URL → Detail drawer opens
3. User reviews signals and recommendation
4. User can override classification
5. Override saved as ReviewDecision
6. Original machine classification preserved

### Export Flow
1. User navigates to export
2. System computes final actions (human override > machine)
3. CSV generated with all columns
4. User downloads mapping sheet
