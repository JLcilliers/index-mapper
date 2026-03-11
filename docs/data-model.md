# Data Model — Index Mapper

## Entity Relationship

```
User
  │
  ├── Client (many)
  │     │
  │     ├── ProjectRun (many)
  │     │     │
  │     │     ├── UploadedFile (many)
  │     │     │
  │     │     └── UrlRecord (many)
  │     │           │
  │     │           └── ReviewDecision (0..1)
  │     │
  │     └── (future: ClientConfig)
  │
  └── RuleConfig (system-level, versioned)
```

## Models

### User
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| email | String | Unique |
| name | String | |
| passwordHash | String | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### Client
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| name | String | |
| domain | String | |
| niche | String? | |
| notes | String? | |
| isActive | Boolean | Default true |
| createdAt | DateTime | |
| updatedAt | DateTime | |
| createdById | String | FK → User |

### ProjectRun
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| name | String | |
| description | String? | |
| status | Enum | draft, processing, classified, in_review, completed |
| urlCount | Int | Default 0, denormalized count |
| createdAt | DateTime | |
| updatedAt | DateTime | |
| clientId | String | FK → Client |
| ruleConfigId | String? | FK → RuleConfig (null = use default) |

### UploadedFile
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| fileName | String | Original filename |
| fileType | String? | Detected type (crawl, gsc, ga, backlinks, sitemap, unknown) |
| fileSize | Int | Bytes |
| rowCount | Int? | Detected row count |
| columnMapping | Json? | Stored mapping of source columns to standard fields |
| uploadedAt | DateTime | |
| projectRunId | String | FK → ProjectRun |

### UrlRecord
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| url | String | Normalized URL |
| urlRaw | String | Original URL as imported |
| pageType | String? | Detected page type |
| statusCode | Int? | |
| indexability | String? | |
| canonical | String? | |
| title | String? | |
| h1 | String? | |
| wordCount | Int? | |
| clicks | Int? | |
| impressions | Int? | |
| ctr | Float? | |
| position | Float? | |
| sessions | Int? | |
| bounceRate | Float? | |
| conversions | Int? | |
| backlinks | Int? | |
| referringDomains | Int? | |
| internalLinksIn | Int? | |
| internalLinksOut | Int? | |
| lastModified | DateTime? | |
| — Derived Fields — | | |
| isIndexable | Boolean? | |
| isOrphan | Boolean? | |
| isThinContent | Boolean? | |
| hasBacklinks | Boolean? | |
| hasConversions | Boolean? | |
| hasTraffic | Boolean? | |
| missingTitle | Boolean? | |
| missingH1 | Boolean? | |
| dataCompleteness | Float? | 0-1 score |
| — Classification — | | |
| classification | String? | keep_as_is, improve_update, redirect_consolidate, remove_deindex |
| confidenceScore | Float? | 0-1 |
| primaryReason | String? | |
| secondaryReason | String? | |
| suggestedAction | String? | |
| suggestedTargetUrl | String? | |
| needsReview | Boolean | Default false |
| reviewTriggers | Json? | Array of trigger reasons |
| — Scoring Detail — | | |
| scoreBreakdown | Json? | { traffic: n, business: n, content: n, ... } |
| totalScore | Float? | |
| — Meta — | | |
| dataSources | Json? | Array of source file types that contributed |
| createdAt | DateTime | |
| updatedAt | DateTime | |
| projectRunId | String | FK → ProjectRun |

**Index**: (projectRunId, url) should be unique.
**Index**: (projectRunId, classification) for filtered queries.
**Index**: (projectRunId, needsReview) for review queue.

### ReviewDecision
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| originalClassification | String | What the machine said |
| finalClassification | String | What the human decided |
| reason | String? | Why the human overrode |
| notes | String? | |
| targetUrl | String? | Override redirect target |
| reviewedAt | DateTime | |
| reviewedById | String | FK → User |
| urlRecordId | String | FK → UrlRecord, unique |

### RuleConfig
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| name | String | e.g., "Default v1" |
| isDefault | Boolean | |
| hardRules | Json | Array of hard rule definitions |
| scoreWeights | Json | Weight config for scoring dimensions |
| scoringThresholds | Json | Score boundaries for buckets |
| manualReviewTriggers | Json | Trigger definitions |
| pageTypeModifiers | Json | Score modifiers by page type |
| createdAt | DateTime | |
| updatedAt | DateTime | |

## Scaling Considerations

- UrlRecord is the largest table. With 120 clients × average 5,000 URLs = 600,000 rows.
- All queries on UrlRecord must be scoped by projectRunId.
- Pagination is mandatory for URL listing.
- Classification runs should be batched (process N records at a time).
- Consider adding database indexes on frequently filtered columns.
