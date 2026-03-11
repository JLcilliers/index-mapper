import type {
  IndexabilityRecommendation,
  SecondaryAction,
  ClassificationResult,
  RuleConfigData,
  ScoringThresholds,
} from "@/types";
import type { UrlRecord } from "@prisma/client";
import { evaluateHardRules } from "./hard-rules";
import { computeScores } from "./scoring";
import { checkManualReviewTriggers } from "./manual-review";

function classifyByScore(
  totalScore: number,
  thresholds: ScoringThresholds
): IndexabilityRecommendation {
  if (totalScore >= thresholds.keepIndexed) return "KEEP_INDEXED";
  if (totalScore >= thresholds.keepIndexedImprove) return "KEEP_INDEXED_IMPROVE";
  return "CONSIDER_NOINDEX";
}

function computeConfidence(
  record: UrlRecord,
  totalScore: number,
  thresholds: ScoringThresholds,
  reviewTriggers: string[]
): number {
  let confidence = 0.5;

  // Data completeness adds confidence
  const completeness = record.dataCompleteness ?? 0.3;
  confidence += completeness * 0.3;

  // Distance from threshold adds confidence
  const distances = [
    Math.abs(totalScore - thresholds.keepIndexed),
    Math.abs(totalScore - thresholds.keepIndexedImprove),
  ];
  const minDistance = Math.min(...distances);
  confidence += Math.min(minDistance / 30, 0.15);

  // Review triggers reduce confidence
  confidence -= reviewTriggers.length * 0.05;

  return Math.max(0.3, Math.min(0.95, confidence));
}

function determineSecondaryAction(
  record: UrlRecord,
  recommendation: IndexabilityRecommendation,
  totalScore: number
): SecondaryAction | null {
  // For CONSIDER_NOINDEX, suggest specific implementation
  if (recommendation === "CONSIDER_NOINDEX") {
    if (record.canonical && record.canonical !== record.url) {
      return "canonicalize";
    }
    if (record.backlinks && record.backlinks > 0) {
      return "redirect_to_target"; // Preserve link equity
    }
    return "noindex_only";
  }

  // For KEEP_INDEXED_IMPROVE, suggest what to improve
  if (recommendation === "KEEP_INDEXED_IMPROVE") {
    if (record.isThinContent) return "improve_content";
    if (record.missingTitle || record.missingH1) return "improve_content";
    return "improve_content";
  }

  // For MANUAL_REVIEW, suggest what to investigate
  if (recommendation === "MANUAL_REVIEW_REQUIRED") {
    if (record.pageType === "legal_page" || record.pageType === "utility_page") {
      return "preserve_legal_trust";
    }
    if (record.pageType === "location_page" || record.pageType === "core_service_page") {
      return "review_internally";
    }
    return "review_internally";
  }

  return null;
}

function generateReasons(
  record: UrlRecord,
  recommendation: IndexabilityRecommendation,
  totalScore: number
): { primary: string; secondary: string | null; action: string } {
  const reasons: string[] = [];

  // Traffic assessment
  const hasTraffic = (record.clicks ?? 0) > 0 || (record.sessions ?? 0) > 0;
  const hasImpressions = (record.impressions ?? 0) > 0;

  if (!hasTraffic && !hasImpressions) {
    reasons.push("No organic traffic or impressions detected");
  } else if (!hasTraffic && hasImpressions) {
    reasons.push(`Has impressions (${record.impressions}) but no clicks — page is indexed but not attracting clicks`);
  } else if ((record.clicks ?? 0) > 50) {
    reasons.push(`Strong organic traffic (${record.clicks} clicks)`);
  } else if (hasTraffic) {
    reasons.push(`Low organic traffic (${record.clicks ?? 0} clicks)`);
  }

  // Backlink assessment
  if (record.backlinks && record.backlinks > 10) {
    reasons.push(`Strong backlink profile (${record.backlinks} backlinks)`);
  } else if (!record.hasBacklinks) {
    reasons.push("No external backlinks");
  }

  // Content assessment
  if (record.isThinContent) {
    reasons.push(`Thin content (${record.wordCount ?? 0} words)`);
  }
  if (record.missingTitle) {
    reasons.push("Missing page title");
  }

  // Conversion assessment
  if (record.hasConversions) {
    reasons.push(`Generating conversions (${record.conversions})`);
  }

  // Internal link assessment
  if (record.isOrphan) {
    reasons.push("Orphan page — no internal links pointing to it");
  } else if (record.internalLinksIn && record.internalLinksIn >= 10) {
    reasons.push("Strong internal linking support");
  }

  // Page type context
  if (record.pageType && record.pageType !== "unknown") {
    reasons.push(`Page type: ${record.pageType.replace(/_/g, " ")}`);
  }

  // Score
  reasons.push(`Indexability score: ${Math.round(totalScore)}/100`);

  const primary = reasons[0] || `Score: ${Math.round(totalScore)}`;
  const secondary = reasons.length > 1 ? reasons[1] : null;

  // Action suggestion based on new recommendations
  const actions: Record<IndexabilityRecommendation, string> = {
    KEEP_INDEXED: "No action needed — page should remain in the index",
    KEEP_INDEXED_IMPROVE: "Keep indexed but improve content, on-page SEO, or internal linking",
    CONSIDER_NOINDEX: "Consider adding noindex — review and approve before implementing",
    MANUAL_REVIEW_REQUIRED: "Human review required — conflicting signals detected",
  };

  return {
    primary,
    secondary,
    action: actions[recommendation],
  };
}

export function classifyUrl(
  record: UrlRecord,
  config: RuleConfigData
): ClassificationResult {
  // Step 1: Check hard rules
  const hardRuleResult = evaluateHardRules(record, config.hardRules);
  if (hardRuleResult.matched) {
    const reviewTriggers = checkManualReviewTriggers(
      record,
      config.manualReviewTriggers,
      100,
      config.scoringThresholds
    );

    const recommendation = hardRuleResult.recommendation!;
    const secondaryAction = determineSecondaryAction(record, recommendation, 0);

    return {
      recommendation,
      secondaryAction,
      confidenceScore: hardRuleResult.confidence!,
      primaryReason: hardRuleResult.reason!,
      secondaryReason: null,
      suggestedAction: getHardRuleAction(recommendation),
      suggestedTargetUrl: null,
      needsReview: reviewTriggers.length > 0 || recommendation === "MANUAL_REVIEW_REQUIRED",
      reviewTriggers,
      scoreBreakdown: {
        trafficValue: 0,
        businessValue: 0,
        contentQuality: 0,
        backlinkValue: 0,
        internalImportance: 0,
        topicalRelevance: 0,
        technicalHealth: 0,
      },
      totalScore: 0,
    };
  }

  // Step 2: Compute weighted scores
  const { breakdown, totalScore } = computeScores(
    record,
    config.scoreWeights,
    config.pageTypeModifiers
  );

  // Step 3: Check manual review triggers first
  const reviewTriggers = checkManualReviewTriggers(
    record,
    config.manualReviewTriggers,
    totalScore,
    config.scoringThresholds
  );

  // Step 4: Classify by score
  let recommendation: IndexabilityRecommendation;
  if (reviewTriggers.length > 0) {
    // If any review triggers fire, override to MANUAL_REVIEW
    recommendation = "MANUAL_REVIEW_REQUIRED";
  } else {
    recommendation = classifyByScore(totalScore, config.scoringThresholds);
  }

  // Step 5: Compute confidence
  const confidenceScore = computeConfidence(
    record,
    totalScore,
    config.scoringThresholds,
    reviewTriggers
  );

  // Additional review trigger: low confidence
  if (confidenceScore < 0.5 && !reviewTriggers.includes("Classification confidence is too low for auto-action")) {
    reviewTriggers.push("Classification confidence is too low for auto-action");
    if (recommendation !== "MANUAL_REVIEW_REQUIRED") {
      recommendation = "MANUAL_REVIEW_REQUIRED";
    }
  }

  // Step 6: Generate reasons
  const reasons = generateReasons(record, recommendation, totalScore);

  // Step 7: Determine secondary action
  const secondaryAction = determineSecondaryAction(record, recommendation, totalScore);

  // Step 8: Suggest target URL for redirects
  let suggestedTargetUrl: string | null = null;
  if (secondaryAction === "redirect_to_target" && record.canonical && record.canonical !== record.url) {
    suggestedTargetUrl = record.canonical;
  }

  return {
    recommendation,
    secondaryAction,
    confidenceScore,
    primaryReason: reasons.primary,
    secondaryReason: reasons.secondary,
    suggestedAction: reasons.action,
    suggestedTargetUrl,
    needsReview: reviewTriggers.length > 0 || recommendation === "MANUAL_REVIEW_REQUIRED",
    reviewTriggers,
    scoreBreakdown: breakdown,
    totalScore,
  };
}

function getHardRuleAction(recommendation: IndexabilityRecommendation): string {
  const actions: Record<IndexabilityRecommendation, string> = {
    KEEP_INDEXED: "No action needed — keep indexed",
    KEEP_INDEXED_IMPROVE: "Keep indexed, improve content",
    CONSIDER_NOINDEX: "Review and consider adding noindex",
    MANUAL_REVIEW_REQUIRED: "Requires human review before any action",
  };
  return actions[recommendation];
}

export function classifyUrls(
  records: UrlRecord[],
  config: RuleConfigData
): Map<string, ClassificationResult> {
  const results = new Map<string, ClassificationResult>();

  for (const record of records) {
    results.set(record.id, classifyUrl(record, config));
  }

  return results;
}
