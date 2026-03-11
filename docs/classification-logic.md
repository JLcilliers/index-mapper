# Classification Logic — Indexability Decision Engine

## Overview

The classification engine evaluates each URL and produces an **indexability recommendation**. The primary question is: "Should this page remain in Google's index?"

## Output States

### Primary Recommendation

| State | Meaning | Auto-action safe? |
|---|---|---|
| `KEEP_INDEXED` | Page should remain indexed — it provides value | Yes |
| `KEEP_INDEXED_IMPROVE` | Keep indexed but needs improvement to maximize value | Yes (keep) |
| `CONSIDER_NOINDEX` | System recommends this page be noindexed | **No — requires human approval** |
| `MANUAL_REVIEW_REQUIRED` | Conflicting signals — human must decide | No |

**Critical rule**: The system NEVER auto-noindexes. `CONSIDER_NOINDEX` is a recommendation that must be approved by a human reviewer before any implementation action is taken.

### Secondary Action Types

Each URL may also carry a secondary action suggestion:

- `improve_content` — Update/expand content
- `consolidate_pages` — Merge with similar page
- `redirect_to_target` — 301 redirect to better page
- `canonicalize` — Set canonical to preferred version
- `noindex_only` — Add noindex, keep page accessible
- `review_internally` — Needs team discussion
- `investigate_tracking` — Check if tracking/analytics is set up
- `preserve_legal_trust` — Keep for compliance/trust reasons

## Scoring System (preserved from v1, remapped)

The 7-dimensional scoring system is retained:

| Dimension | Weight | What it measures |
|---|---|---|
| Traffic Value | 20% | Clicks, impressions, sessions |
| Business Value | 20% | Conversions, strategic page type |
| Content Quality | 15% | Word count, title, H1 |
| Backlink Value | 15% | External links, referring domains |
| Internal Importance | 10% | Internal link structure |
| Topical Relevance | 10% | Page type strategic fit |
| Technical Health | 10% | Status code, indexability, canonical |

### Threshold Mapping

| Total Score | Recommendation |
|---|---|
| >= 65 | KEEP_INDEXED |
| 45–64 | KEEP_INDEXED_IMPROVE |
| < 45 | CONSIDER_NOINDEX |

Any URL with active manual review triggers → `MANUAL_REVIEW_REQUIRED` (regardless of score).

## Noindex Decision Logic

A page is flagged as `CONSIDER_NOINDEX` when **multiple signals align**:

### Strong noindex signals (each adds weight)
- Zero impressions over 6+ months
- Zero clicks over 6+ months
- Page type is archive/tag/author/filter/search/template
- Thin content (< 200 words) with no unique value
- Duplicate title or H1 with another page
- Not internally linked (orphan)
- Not a conversion asset
- Not strategically relevant to services/locations
- Not legally required

### Strong keep-indexed signals (each overrides)
- Has meaningful impressions (even without clicks)
- Ranks for any terms (position data exists)
- Is a service or location page
- Has conversions
- Has backlinks from external sites
- Supports E-E-A-T/trust
- Is legally required (privacy, terms, etc.)
- Is part of a valid topical cluster
- Supports navigation/UX

### Automatic MANUAL_REVIEW_REQUIRED triggers
- Conflicting signals (positive + negative signals both strong)
- GSC data missing or incomplete
- Low-performing but strategically important page type
- Possible duplicate intent but uncertain
- URL matching between crawl and GSC is unclear
- Traffic is low but page type suggests it could be needed
- Score is within 5 points of a threshold boundary
- Page has backlinks but zero traffic
- Page has conversions but low traffic

## Hard Rules (preserved and extended)

### Auto-KEEP rules (high confidence)
- Homepage → KEEP_INDEXED (confidence: 0.99)
- Legal pages → KEEP_INDEXED (confidence: 0.95)

### Auto-CONSIDER_NOINDEX rules (still requires human approval)
- 404/410 pages → CONSIDER_NOINDEX (confidence: 0.95)
- 5xx pages → CONSIDER_NOINDEX (confidence: 0.85)
- Media attachments with zero value → CONSIDER_NOINDEX (confidence: 0.90)
- Empty tag/category pages → CONSIDER_NOINDEX (confidence: 0.85)

### Auto-MANUAL_REVIEW rules
- Canonical points elsewhere → MANUAL_REVIEW_REQUIRED
- Location pages (strategic but may be low-traffic) → MANUAL_REVIEW_REQUIRED

## Confidence Score

Confidence ranges from 0.30 to 0.95:

- **Base**: 0.50
- **Data completeness bonus**: up to +0.30
- **Threshold distance bonus**: up to +0.15
- **Review trigger penalty**: -0.05 per active trigger
- **Minimum floor**: 0.30

## What Traffic Alone Does NOT Determine

A page with zero traffic is **not** automatically a noindex candidate. The engine must also consider:

1. **Page type**: Service/location/trust pages should often remain indexed even with low traffic
2. **Impressions**: Having impressions without clicks = the page IS indexed and ranking
3. **Business context**: A core service page with zero traffic still needs indexing
4. **Backlink equity**: Noindexing a page with backlinks wastes link equity
5. **Recency**: Newly published pages may not have traffic yet
6. **Topical completeness**: Removing cluster pages can hurt remaining pages

## Implementation

The classification engine lives in `src/lib/classification/` and the core output type is:

```typescript
type IndexabilityRecommendation =
  | 'KEEP_INDEXED'
  | 'KEEP_INDEXED_IMPROVE'
  | 'CONSIDER_NOINDEX'
  | 'MANUAL_REVIEW_REQUIRED';

type SecondaryAction =
  | 'improve_content'
  | 'consolidate_pages'
  | 'redirect_to_target'
  | 'canonicalize'
  | 'noindex_only'
  | 'review_internally'
  | 'investigate_tracking'
  | 'preserve_legal_trust';
```
