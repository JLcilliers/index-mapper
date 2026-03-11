# Classification Logic — Index Mapper

## Action Buckets

### 1. keep_as_is
The page is healthy, performing, and should remain indexed as-is.
- Good traffic or conversions
- Strong backlink profile
- Unique, relevant content
- Technically sound

### 2. improve_update
The page has value but needs improvement to perform better.
- Thin content that covers an important topic
- Outdated content with good backlinks
- Pages with declining traffic but strategic importance
- Pages with technical issues that are fixable

### 3. redirect_consolidate
The page should be redirected to a better page or consolidated with similar content.
- Duplicate or near-duplicate content
- Cannibalization with a stronger page
- Old campaign pages with backlinks
- Multiple thin pages covering the same topic

### 4. remove_deindex
The page should be removed from the index entirely.
- Zero value: no traffic, no backlinks, no conversions
- Auto-generated junk
- Expired campaigns with no backlinks
- Tag/category pages with no content
- Media attachment pages

## Classification Pipeline

### A. Hard Rules (Short-Circuit)

Hard rules produce immediate classifications with high confidence:

| Rule | Classification | Confidence |
|------|---------------|------------|
| Status 404/410/5xx | remove_deindex | 0.95 |
| Noindex tag present | remove_deindex (validate) | 0.7 |
| Homepage | keep_as_is | 0.99 |
| Legal pages (privacy, terms) | keep_as_is | 0.95 |
| Page type = media/attachment AND no backlinks AND no traffic | remove_deindex | 0.9 |
| Page type = tag/category AND word count < 100 AND no traffic | remove_deindex | 0.85 |
| Redirect chain detected | redirect_consolidate | 0.85 |
| Canonical points elsewhere | redirect_consolidate | 0.8 |

### B. Weighted Scoring

For URLs not caught by hard rules, compute scores across dimensions:

| Dimension | Weight | Signals Used |
|-----------|--------|--------------|
| Traffic Value | 0.20 | clicks, impressions, sessions |
| Business Value | 0.20 | conversions, page type strategic importance |
| Content Quality | 0.15 | word count, title present, H1 present, freshness |
| Backlink Value | 0.15 | external backlinks count, referring domains |
| Internal Importance | 0.10 | internal links in, internal links out, depth |
| Topical Relevance | 0.10 | content fit score (manual or inferred from page type) |
| Technical Health | 0.10 | status code, indexability, canonical consistency |

Each dimension produces a score from 0-100.

#### Scoring Thresholds

| Total Score | Classification |
|-------------|---------------|
| >= 70 | keep_as_is |
| 50-69 | improve_update |
| 30-49 | redirect_consolidate |
| < 30 | remove_deindex |

### C. Confidence Calculation

Confidence reflects how much data we have and how clear the signal is:

- Base confidence starts at 0.5
- Each available data source adds confidence: +0.1 per source (crawl, GSC, GA, backlinks)
- Score distance from threshold boundary adds confidence: farther = more confident
- Conflicting signals reduce confidence: -0.1 per major conflict
- Maximum confidence: 0.95 (never 1.0 for machine classification)
- Minimum confidence: 0.3

### D. Manual Review Triggers

These conditions flag a URL for human review regardless of classification:

| Trigger | Reason |
|---------|--------|
| Low traffic + strong backlinks (>5) | May have SEO value worth preserving |
| Low traffic + conversions present | Revenue-generating despite low volume |
| Possible duplicate without clear winner | Need human judgment on which to keep |
| Legal/trust/utility page type | Should not be auto-removed |
| Seasonal page (detected by URL pattern) | May be valuable at certain times |
| Location page | Strategic local SEO value |
| Missing data (< 2 data sources) | Insufficient data for confident classification |
| Conflicting signals (3+ conflicts) | Machine cannot resolve |
| Confidence < 0.5 | Too uncertain for auto-action |
| Score near threshold boundary (within 5 points) | Could go either way |

### E. Page Type Scoring Adjustments

Different page types have different baseline expectations:

| Page Type | Score Modifier | Notes |
|-----------|---------------|-------|
| homepage | +50 | Almost always keep |
| core_service_page | +30 | High strategic value |
| service_subpage | +15 | Important for service depth |
| location_page | +20 | Local SEO value |
| blog_article | 0 | Judged on metrics |
| evergreen_guide | +10 | Long-term content value |
| faq_page | +5 | Supporting content |
| category_tag_page | -10 | Often low value |
| author_page | -15 | Usually thin |
| legal_page | +40 | Must keep, flag for review |
| utility_page | +10 | Functional importance |
| media_attachment | -25 | Usually should not be indexed |
| old_campaign_page | -20 | Usually expired |

### F. Reason Generation

Each classification includes:
- **primary_reason**: The strongest factor driving the classification
- **secondary_reason**: The second strongest factor
- **suggested_next_step**: Actionable recommendation

Example reasons:
- "Zero organic traffic and no backlinks for 12+ months"
- "Thin content (< 200 words) on non-strategic page type"
- "Strong backlink profile (15 referring domains) preserves value"
- "Duplicate content cluster detected — recommend consolidating to /main-page"
- "Declining traffic but 3 conversions last quarter — review before action"
