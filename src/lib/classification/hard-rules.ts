import type { IndexabilityRecommendation, HardRule } from "@/types";
import type { UrlRecord } from "@prisma/client";

export interface HardRuleResult {
  matched: boolean;
  recommendation?: IndexabilityRecommendation;
  confidence?: number;
  reason?: string;
}

type RuleEvaluator = (record: UrlRecord) => boolean;

const RULE_EVALUATORS: Record<string, RuleEvaluator> = {
  statusCode_is_404_or_410: (r) =>
    r.statusCode === 404 || r.statusCode === 410,

  statusCode_is_5xx: (r) =>
    r.statusCode !== null && r.statusCode !== undefined && r.statusCode >= 500,

  pageType_is_homepage: (r) => r.pageType === "homepage",

  pageType_is_legal: (r) => r.pageType === "legal_page",

  canonical_points_elsewhere: (r) => {
    if (!r.canonical || r.canonical === "" || r.canonical === r.url) return false;
    // Normalize trailing slashes and protocol for comparison
    const normalize = (u: string) =>
      u.replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
    const normCanonical = normalize(r.canonical);
    const normUrl = normalize(r.url);
    return normCanonical !== normUrl;
  },

  media_attachment_no_value: (r) =>
    r.pageType === "media_attachment" &&
    (!r.clicks || r.clicks === 0) &&
    (!r.sessions || r.sessions === 0) &&
    (!r.backlinks || r.backlinks === 0),

  empty_tag_category: (r) =>
    r.pageType === "category_tag_page" &&
    (r.wordCount === null || r.wordCount === undefined || r.wordCount < 100) &&
    (!r.clicks || r.clicks === 0) &&
    (!r.sessions || r.sessions === 0),

  meta_robots_noindex: (r) => {
    const metaRobots = (r as Record<string, unknown>).metaRobots as string | null;
    return metaRobots !== null &&
      metaRobots !== undefined &&
      metaRobots.toLowerCase().includes("noindex");
  },
};

export function evaluateHardRules(
  record: UrlRecord,
  rules: HardRule[]
): HardRuleResult {
  for (const rule of rules) {
    if (!rule.enabled) continue;

    const evaluator = RULE_EVALUATORS[rule.condition];
    if (!evaluator) continue;

    if (evaluator(record)) {
      return {
        matched: true,
        recommendation: rule.recommendation,
        confidence: rule.confidence,
        reason: rule.reason,
      };
    }
  }

  return { matched: false };
}
