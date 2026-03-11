import type {
  Classification,
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
): Classification {
  if (totalScore >= thresholds.keepAsIs) return "keep_as_is";
  if (totalScore >= thresholds.improveUpdate) return "improve_update";
  if (totalScore >= thresholds.redirectConsolidate) return "redirect_consolidate";
  return "remove_deindex";
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
    Math.abs(totalScore - thresholds.keepAsIs),
    Math.abs(totalScore - thresholds.improveUpdate),
    Math.abs(totalScore - thresholds.redirectConsolidate),
  ];
  const minDistance = Math.min(...distances);
  confidence += Math.min(minDistance / 30, 0.15);

  // Review triggers reduce confidence
  confidence -= reviewTriggers.length * 0.05;

  return Math.max(0.3, Math.min(0.95, confidence));
}

function generateReasons(
  record: UrlRecord,
  classification: Classification,
  totalScore: number
): { primary: string; secondary: string | null; action: string } {
  const reasons: string[] = [];

  // Traffic assessment
  const hasTraffic = (record.clicks ?? 0) > 0 || (record.sessions ?? 0) > 0;
  if (!hasTraffic) {
    reasons.push("No organic traffic or sessions detected");
  } else if ((record.clicks ?? 0) > 50) {
    reasons.push(`Strong organic traffic (${record.clicks} clicks)`);
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

  // Score context
  reasons.push(`Overall score: ${Math.round(totalScore)}/100`);

  const primary = reasons[0] || `Classification score: ${Math.round(totalScore)}`;
  const secondary = reasons.length > 1 ? reasons[1] : null;

  // Action suggestion
  const actions: Record<Classification, string> = {
    keep_as_is: "No action needed — monitor in next audit cycle",
    improve_update: "Update content, optimize on-page SEO, and improve internal linking",
    redirect_consolidate: "Set up 301 redirect to the strongest related page",
    remove_deindex: "Add noindex tag or request removal from index",
  };

  return {
    primary,
    secondary,
    action: actions[classification],
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

    return {
      classification: hardRuleResult.classification!,
      confidenceScore: hardRuleResult.confidence!,
      primaryReason: hardRuleResult.reason!,
      secondaryReason: null,
      suggestedAction: getHardRuleAction(hardRuleResult.classification!),
      suggestedTargetUrl: null,
      needsReview: reviewTriggers.length > 0,
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

  // Step 3: Classify by score
  const classification = classifyByScore(totalScore, config.scoringThresholds);

  // Step 4: Check manual review triggers
  const reviewTriggers = checkManualReviewTriggers(
    record,
    config.manualReviewTriggers,
    totalScore,
    config.scoringThresholds
  );

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
  }

  // Step 6: Generate reasons
  const reasons = generateReasons(record, classification, totalScore);

  // Step 7: Suggest target URL for redirects
  let suggestedTargetUrl: string | null = null;
  if (classification === "redirect_consolidate" && record.canonical && record.canonical !== record.url) {
    suggestedTargetUrl = record.canonical;
  }

  return {
    classification,
    confidenceScore,
    primaryReason: reasons.primary,
    secondaryReason: reasons.secondary,
    suggestedAction: reasons.action,
    suggestedTargetUrl,
    needsReview: reviewTriggers.length > 0,
    reviewTriggers,
    scoreBreakdown: breakdown,
    totalScore,
  };
}

function getHardRuleAction(classification: Classification): string {
  const actions: Record<Classification, string> = {
    keep_as_is: "No action needed",
    improve_update: "Update content and optimize",
    redirect_consolidate: "Set up 301 redirect",
    remove_deindex: "Add noindex or remove page",
  };
  return actions[classification];
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
