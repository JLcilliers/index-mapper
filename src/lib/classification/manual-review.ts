import type { ManualReviewTrigger, ScoringThresholds } from "@/types";
import type { UrlRecord } from "@prisma/client";

type TriggerEvaluator = (
  record: UrlRecord,
  totalScore: number,
  thresholds: ScoringThresholds
) => boolean;

const TRIGGER_EVALUATORS: Record<string, TriggerEvaluator> = {
  has_backlinks_no_traffic: (r) =>
    (r.backlinks !== null && r.backlinks !== undefined && r.backlinks > 5) &&
    (!r.clicks || r.clicks === 0) &&
    (!r.sessions || r.sessions === 0),

  has_conversions_low_traffic: (r) =>
    (r.conversions !== null && r.conversions !== undefined && r.conversions > 0) &&
    (!r.clicks || r.clicks < 10),

  is_legal_or_utility: (r) =>
    r.pageType === "legal_page" || r.pageType === "utility_page",

  low_data_completeness: (r) =>
    r.dataCompleteness !== null &&
    r.dataCompleteness !== undefined &&
    r.dataCompleteness < 0.3,

  has_conflicting_signals: (r) => {
    let positiveSignals = 0;
    let negativeSignals = 0;

    if (r.backlinks && r.backlinks > 5) positiveSignals++;
    if (r.conversions && r.conversions > 0) positiveSignals++;
    if (r.internalLinksIn && r.internalLinksIn >= 10) positiveSignals++;

    if (!r.clicks || r.clicks === 0) negativeSignals++;
    if (r.isThinContent) negativeSignals++;
    if (r.isOrphan) negativeSignals++;

    return positiveSignals >= 2 && negativeSignals >= 2;
  },

  confidence_below_threshold: () => {
    // This is checked after confidence is calculated in the engine
    return false; // Handled in engine.ts
  },

  score_near_threshold: (_r, totalScore, thresholds) => {
    const margin = 5;
    return (
      Math.abs(totalScore - thresholds.keepAsIs) <= margin ||
      Math.abs(totalScore - thresholds.improveUpdate) <= margin ||
      Math.abs(totalScore - thresholds.redirectConsolidate) <= margin
    );
  },

  is_location_page: (r) => r.pageType === "location_page",
};

export function checkManualReviewTriggers(
  record: UrlRecord,
  triggers: ManualReviewTrigger[],
  totalScore: number,
  thresholds: ScoringThresholds
): string[] {
  const matchedReasons: string[] = [];

  for (const trigger of triggers) {
    if (!trigger.enabled) continue;

    const evaluator = TRIGGER_EVALUATORS[trigger.condition];
    if (!evaluator) continue;

    if (evaluator(record, totalScore, thresholds)) {
      matchedReasons.push(trigger.reason);
    }
  }

  return matchedReasons;
}
