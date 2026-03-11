# Data Ingestion — Index Mapper

## CSV Import Strategy

### Supported File Types
The system accepts any CSV file. It uses header inspection to determine what type of data the file contains.

### Column Mapping

The column mapper uses fuzzy matching to identify standard SEO fields from various tools.

#### URL Field Detection
Look for columns matching: `url`, `address`, `page`, `landing page`, `page path`, `loc`, `location`

#### Common Source Patterns

**Screaming Frog Crawl Export**
- Address, Status Code, Indexability, Title 1, H1-1, Word Count, Canonical Link, Internal Links In, Internal Links Out

**Google Search Console Export**
- Top pages: Page, Clicks, Impressions, CTR, Position
- URL inspection: URL, Coverage, Indexing state

**Google Analytics Export**
- Landing Page, Sessions, Users, Bounce Rate, Conversions, Revenue

**Ahrefs/SEMrush Backlinks Export**
- URL, Referring Domains, Backlinks, Domain Rating

**Sitemap Export**
- loc, lastmod, changefreq, priority

### Normalization Rules

#### URL Normalization
1. Lowercase the URL
2. Remove trailing slashes (except root)
3. Remove URL fragments (#...)
4. Remove common tracking parameters (utm_*, fbclid, gclid)
5. Decode URL-encoded characters
6. Ensure protocol prefix (default https://)
7. Remove www. prefix for matching, store original

#### Value Normalization
- Numbers: strip commas, convert to numeric
- Dates: parse to ISO format
- Booleans: map yes/no/true/false/1/0
- Empty strings: treat as null

### Record Merging

When multiple CSVs contain data for the same URL:
1. Normalize all URLs
2. Group by normalized URL
3. For each group, merge fields:
   - First non-null value wins for single-source fields
   - Sum for additive metrics (use latest period data)
   - Keep all sources metadata

### Derived Fields

After merging, compute:

| Field | Logic |
|-------|-------|
| is_indexable | status 200 AND indexability != "Non-Indexable" AND no noindex |
| is_orphan | internal_links_in == 0 OR internal_links_in IS NULL |
| likely_thin_content | word_count < 200 (when available) |
| has_backlinks | backlinks > 0 OR referring_domains > 0 |
| has_conversions | conversions > 0 |
| has_traffic | clicks > 0 OR sessions > 0 |
| missing_title | title IS NULL OR title == "" |
| missing_h1 | h1 IS NULL OR h1 == "" |
| strong_internal_support | internal_links_in >= 10 |
| duplicate_cluster_candidate | flagged by title/URL similarity grouping |
| data_completeness | count of available data dimensions / total possible |

### Graceful Degradation

The system must work with any subset of data:
- Only sitemap → Can identify URLs, detect page types from URL patterns
- Only crawl → Full technical data, no performance data
- Only GSC → Traffic data, limited technical data
- All sources → Full confidence classification

Missing data reduces confidence scores but does not block classification.
