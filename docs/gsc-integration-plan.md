# Google Search Console Integration Plan

## Overview

The tool needs to pull page-level performance data from GSC for each client's domain. This is a core data source for indexability decisions — a page's search performance (clicks, impressions, CTR, position) is the primary signal for whether it should remain indexed.

## Authentication Model

### Chosen Approach: Single Google Account (Shared Agency Connection)

For an internal agency tool managing 120+ clients, the simplest model is:

1. **One Google account** connects to the tool (the agency's master GSC account)
2. This account has access to all client GSC properties (typical for agencies)
3. All team members use the same connection
4. No per-user Google OAuth needed

This avoids complexity of multi-user OAuth while perfectly serving the use case of a single agency managing all properties from one account.

### Implementation

- **Google OAuth 2.0** with offline access (refresh tokens)
- **Scopes**: `https://www.googleapis.com/auth/webmasters.readonly`
- Store tokens encrypted in the database
- Auto-refresh access tokens using refresh token
- Single "Connect Google Account" button in Settings

### Google Cloud Setup Required

1. Create Google Cloud project
2. Enable Search Console API
3. Create OAuth 2.0 credentials (Web application)
4. Set authorized redirect URI: `{APP_URL}/api/auth/google/callback`
5. Add environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

## Data Flow

### 1. Property Linking

When creating/editing a client:
1. User enters the client domain
2. System lists all GSC properties accessible to the connected Google account
3. User selects the matching property (could be `sc-domain:example.com` or `https://www.example.com/`)
4. Property ID is stored on the Client record

### 2. Data Pull

When starting a run or refreshing GSC data:
1. User selects date range (last 3/6/12 months or custom)
2. System calls GSC API: `searchanalytics.query` with `dimensions: ['page']`
3. API returns page-level aggregated metrics
4. System normalizes URLs and stores metrics

### 3. URL Matching

GSC URLs must be matched to crawled URLs:
- Normalize both sets (protocol, www, trailing slash, case)
- Direct match on normalized URL
- Flag unmatched URLs from either side:
  - Crawled but not in GSC → page may not be indexed or may be new
  - In GSC but not crawled → page may be blocked, redirected, or orphaned

## GSC API Details

### Endpoint
`POST https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query`

### Request
```json
{
  "startDate": "2025-09-11",
  "endDate": "2026-03-11",
  "dimensions": ["page"],
  "rowLimit": 25000,
  "startRow": 0
}
```

### Response Fields (per page)
- `keys[0]`: Page URL
- `clicks`: Total clicks
- `impressions`: Total impressions
- `ctr`: Average CTR
- `position`: Average position

### Pagination
- Max 25,000 rows per request
- Use `startRow` for pagination
- Most client sites will have far fewer than 25,000 indexed pages

### Rate Limits
- 1,200 queries per minute per project
- Generous for our use case (one query per client per run)

## Schema Changes

```prisma
model GoogleConnection {
  id           String   @id @default(cuid())
  accessToken  String
  refreshToken String
  tokenExpiry  DateTime
  email        String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

// Add to Client model:
model Client {
  // ... existing fields
  gscProperty  String?   // e.g. "sc-domain:example.com"
}
```

## Date Range Options

| Option | Start Date | End Date |
|---|---|---|
| Last 3 months | today - 90 days | today - 3 days* |
| Last 6 months | today - 180 days | today - 3 days |
| Last 12 months | today - 365 days | today - 3 days |
| Custom | user-selected | user-selected |

*GSC data has a ~3-day delay, so end date should be 3 days before today.

## Error Handling

- **No property access**: Show clear message, suggest checking permissions
- **Token expired**: Auto-refresh using refresh token
- **API quota exceeded**: Queue and retry with backoff
- **No data for date range**: Show warning but continue with crawl-only data
- **Property mismatch**: Warn if GSC property domain doesn't match client domain

## File Structure

```
src/lib/google/
  auth.ts          — OAuth flow, token management
  search-console.ts — GSC API client
  url-matching.ts   — Normalize and match GSC URLs to crawl URLs
```
