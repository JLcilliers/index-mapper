export type Classification =
  | "keep_as_is"
  | "improve_update"
  | "redirect_consolidate"
  | "remove_deindex";

export type RunStatus =
  | "draft"
  | "processing"
  | "classified"
  | "in_review"
  | "completed";

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
  classification: Classification;
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
  classification: Classification;
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
  keepAsIs: number;
  improveUpdate: number;
  redirectConsolidate: number;
}

export interface ManualReviewTrigger {
  id: string;
  name: string;
  condition: string;
  reason: string;
  enabled: boolean;
}

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
}

export interface NormalizedUrlData {
  url: string;
  urlRaw: string;
  statusCode?: number | null;
  indexability?: string | null;
  canonical?: string | null;
  title?: string | null;
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

export interface UrlFilterParams {
  projectRunId: string;
  classification?: Classification;
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
