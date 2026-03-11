// ── Indexability Recommendations (primary output) ──

export type IndexabilityRecommendation =
  | "KEEP_INDEXED"
  | "KEEP_INDEXED_IMPROVE"
  | "CONSIDER_NOINDEX"
  | "MANUAL_REVIEW_REQUIRED";

export type SecondaryAction =
  | "improve_content"
  | "consolidate_pages"
  | "redirect_to_target"
  | "canonicalize"
  | "noindex_only"
  | "review_internally"
  | "investigate_tracking"
  | "preserve_legal_trust";

// Legacy alias — old code may still reference this
export type Classification = IndexabilityRecommendation;

// ── Run Status ──

export type RunStatus =
  | "draft"
  | "crawling"
  | "crawl_complete"
  | "fetching_gsc"
  | "merging"
  | "classifying"
  | "classified"
  | "in_review"
  | "completed";

// ── File & Page Types ──

export type FileType =
  | "crawl"
  | "gsc"
  | "ga"
  | "backlinks"
  | "sitemap"
  | "unknown";

export type PageType =
  | "homepage"
  | "core_service_page"
  | "service_subpage"
  | "location_page"
  | "blog_article"
  | "evergreen_guide"
  | "faq_page"
  | "category_tag_page"
  | "author_page"
  | "legal_page"
  | "utility_page"
  | "media_attachment"
  | "old_campaign_page"
  | "unknown";

// ── Scoring ──

export interface ScoreBreakdown {
  trafficValue: number;
  businessValue: number;
  contentQuality: number;
  backlinkValue: number;
  internalImportance: number;
  topicalRelevance: number;
  technicalHealth: number;
}

export interface ClassificationResult {
  recommendation: IndexabilityRecommendation;
  secondaryAction: SecondaryAction | null;
  confidenceScore: number;
  primaryReason: string;
  secondaryReason: string | null;
  suggestedAction: string;
  suggestedTargetUrl: string | null;
  needsReview: boolean;
  reviewTriggers: string[];
  scoreBreakdown: ScoreBreakdown;
  totalScore: number;
}

// ── Rule Configuration ──

export interface RuleConfigData {
  hardRules: HardRule[];
  scoreWeights: ScoreWeights;
  scoringThresholds: ScoringThresholds;
  manualReviewTriggers: ManualReviewTrigger[];
  pageTypeModifiers: Record<string, number>;
}

export interface HardRule {
  id: string;
  name: string;
  condition: string;
  recommendation: IndexabilityRecommendation;
  confidence: number;
  reason: string;
  enabled: boolean;
}

export interface ScoreWeights {
  trafficValue: number;
  businessValue: number;
  contentQuality: number;
  backlinkValue: number;
  internalImportance: number;
  topicalRelevance: number;
  technicalHealth: number;
}

export interface ScoringThresholds {
  keepIndexed: number;
  keepIndexedImprove: number;
}

export interface ManualReviewTrigger {
  id: string;
  name: string;
  condition: string;
  reason: string;
  enabled: boolean;
}

// ── CSV Ingestion (fallback) ──

export interface ColumnMapping {
  url?: string;
  statusCode?: string;
  indexability?: string;
  canonical?: string;
  title?: string;
  h1?: string;
  wordCount?: string;
  clicks?: string;
  impressions?: string;
  ctr?: string;
  position?: string;
  sessions?: string;
  bounceRate?: string;
  conversions?: string;
  backlinks?: string;
  referringDomains?: string;
  internalLinksIn?: string;
  internalLinksOut?: string;
  lastModified?: string;
  metaRobots?: string;
  metaDescription?: string;
}

export interface NormalizedUrlData {
  url: string;
  urlRaw: string;
  statusCode?: number | null;
  indexability?: string | null;
  canonical?: string | null;
  metaRobots?: string | null;
  title?: string | null;
  metaDescription?: string | null;
  h1?: string | null;
  wordCount?: number | null;
  clicks?: number | null;
  impressions?: number | null;
  ctr?: number | null;
  position?: number | null;
  sessions?: number | null;
  bounceRate?: number | null;
  conversions?: number | null;
  backlinks?: number | null;
  referringDomains?: number | null;
  internalLinksIn?: number | null;
  internalLinksOut?: number | null;
  lastModified?: Date | null;
  dataSources: string[];
}

// ── Crawler ──

export interface CrawlResult {
  url: string;
  statusCode: number;
  canonical: string | null;
  metaRobots: string | null;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  wordCount: number;
  contentType: string | null;
  responseTimeMs: number;
  internalLinks: string[];
  externalLinks: string[];
}

export interface CrawlProgress {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  status: RunStatus;
}

// ── GSC ──

export interface GscPageData {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

// ── Filters & Pagination ──

export interface UrlFilterParams {
  projectRunId: string;
  recommendation?: IndexabilityRecommendation;
  pageType?: string;
  needsReview?: boolean;
  isIndexable?: boolean;
  hasTraffic?: boolean;
  hasBacklinks?: boolean;
  hasConversions?: boolean;
  isThinContent?: boolean;
  isOrphan?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
