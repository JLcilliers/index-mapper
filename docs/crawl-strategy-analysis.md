# Crawl Strategy Analysis for MVP

## Options Evaluated

### Option 1: Firecrawl API

**Pros:**
- Full managed crawl service — no infrastructure to maintain
- Returns clean markdown/structured data
- Handles JavaScript rendering
- Respects robots.txt
- Built-in rate limiting and politeness

**Cons:**
- **Cost**: At scale across 120+ clients, this gets expensive fast. Firecrawl charges per page crawled. A typical dental/medical site has 50-500 pages; at 120 clients averaging 200 pages = 24,000 pages/month. At $0.01-0.04/page that's $240-960/month just for crawls.
- **Dependency**: Single vendor lock-in for a core function
- **Data gaps**: Firecrawl returns content but not all SEO fields we need (status codes, canonical tags, meta robots, internal link counts, etc. require specific extraction)
- **Rate limits**: Batch crawling 120 sites may hit API limits

**Verdict**: Not recommended as primary for MVP. Too expensive at scale, and doesn't return all the SEO-specific fields we need without custom extraction.

### Option 2: Internal Crawler (fetch/cheerio-based)

**Pros:**
- Zero per-crawl cost
- Full control over what data is extracted
- Can extract all SEO fields (meta robots, canonical, x-robots-tag, link counts, etc.)
- No vendor dependency
- Can be optimized for our specific needs

**Cons:**
- **JavaScript rendering**: Won't execute JS, so SPAs or heavily JS-rendered sites won't work. However, 95%+ of GP's dental/medical clients use WordPress/standard CMSes where server-rendered HTML is available.
- **Vercel serverless constraints**: Functions have execution time limits (10s on hobby, 60s on Pro, 300s on Enterprise). A 500-page crawl takes minutes. Must use background processing.
- **Robots.txt**: Must implement ourselves
- **Rate limiting**: Must implement politeness ourselves
- **Edge cases**: Redirects, relative URLs, encoding issues

**Verdict**: Best option for MVP. Zero cost, full control over SEO field extraction, works for 95%+ of client sites (WordPress/static CMS). JS rendering gap is acceptable for MVP — document it honestly and add later if needed.

### Option 3: Hybrid (internal crawler + optional Firecrawl for JS sites)

**Pros:**
- Best of both — fast cheap crawls for standard sites, JS rendering available when needed
- User can choose per-client

**Cons:**
- Two codepaths to maintain
- Adds complexity for MVP
- Firecrawl still costs money for JS sites

**Verdict**: Good long-term architecture but premature for MVP. Build Option 2 first, add Firecrawl as optional later.

### Option 4: Screaming Frog CSV Import Only (current state)

**Pros:**
- Already built
- Maximum data richness (SF exports everything)
- No API costs

**Cons:**
- Doesn't scale to 120 clients — manual export/import per client
- Requires Screaming Frog license ($259/year)
- Not automated — defeats the product purpose

**Verdict**: Keep as fallback only. Not the primary path.

## Recommendation: Option 2 — Internal Crawler

### Architecture

**Crawl Worker**: A background process that:
1. Starts from the domain's homepage
2. Discovers internal links via HTML parsing
3. Follows links breadth-first up to a configurable depth/page limit
4. Extracts SEO fields from each page
5. Stores results incrementally

**Serverless Constraint Solution**:
- Vercel serverless functions have timeout limits
- Solution: Use a **queue-based crawl** where:
  - API route initiates the crawl and stores it as a "crawl job"
  - A cron-triggered or long-running API route processes URLs from the queue in batches
  - Each batch processes 10-20 URLs within the function timeout
  - Frontend polls for crawl progress
- Alternative: Use Vercel's `maxDuration` (up to 300s on Pro plan) for batch processing

**SEO Fields Extracted Per Page:**
- URL (normalized)
- Status code
- Canonical tag
- Meta robots directive
- Title tag
- Meta description
- H1 tag
- Word count (visible text)
- Internal links out (count + URLs)
- Content type
- Response time

**Fields NOT feasible in MVP (document honestly):**
- X-Robots-Tag (requires header inspection — feasible but lower priority)
- Internal links IN (requires full crawl completion to compute)
- Crawl depth (requires BFS tracking)
- JavaScript-rendered content
- Structured data

**Fields computed post-crawl:**
- Internal links IN (computed from all pages' outlinks)
- Orphan status
- Duplicate title/H1 detection
- Page type classification

### Implementation

```
src/lib/crawler/
  crawler.ts        — Core crawl logic (fetch + cheerio)
  extractor.ts      — HTML → SEO field extraction
  queue.ts          — Crawl queue management
  robots.ts         — robots.txt parser
  url-utils.ts      — URL discovery and filtering
```

### Crawl Limits (configurable per run)
- Max pages: 500 (default), 1000, 2000
- Max depth: 10 (default)
- Concurrency: 3-5 simultaneous requests
- Politeness delay: 200ms between requests to same host
- Timeout per page: 10 seconds
- Respect robots.txt: yes (default)

### Cost Analysis
- Internal crawler: $0/month for crawling
- Only cost is Vercel compute time (included in Pro plan)
- GSC API: Free (Google API quota is generous)
- Database: Supabase free tier handles this easily
