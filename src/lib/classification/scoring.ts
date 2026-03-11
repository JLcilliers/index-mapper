import type { ScoreBreakdown, ScoreWeights } from "@/types";
import type { UrlRecord } from "@prisma/client";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function scoreTrafficValue(record: UrlRecord): number {
  const clicks = record.clicks ?? 0;
  const impressions = record.impressions ?? 0;
  const sessions = record.sessions ?? 0;

  if (clicks === 0 && impressions === 0 && sessions === 0) return 0;

  let score = 0;

  // Click scoring: 0-50 clicks maps to 0-60, 50+ maps to 60-100
  if (clicks > 0) {
    score += clicks >= 50 ? 60 + clamp((clicks - 50) / 10, 0, 40) : (clicks / 50) * 60;
  }

  // Impressions bonus
  if (impressions > 100) {
    score += clamp(impressions / 500, 0, 20);
  }

  // Sessions bonus
  if (sessions > 0) {
    score += clamp(sessions / 10, 0, 20);
  }

  return clamp(score, 0, 100);
}

function scoreBusinessValue(record: UrlRecord): number {
  const conversions = record.conversions ?? 0;
  const pageType = record.pageType ?? "unknown";

  let score = 0;

  // Conversions are highly valuable
  if (conversions > 0) {
    score += conversions >= 10 ? 70 : 30 + (conversions / 10) * 40;
  }

  // Strategic page types get baseline business value
  const strategicTypes: Record<string, number> = {
    homepage: 90,
    core_service_page: 80,
    service_subpage: 60,
    location_page: 55,
    legal_page: 50,
    utility_page: 40,
    faq_page: 45,
    evergreen_guide: 50,
  };

  if (pageType in strategicTypes) {
    score = Math.max(score, strategicTypes[pageType]);
  }

  return clamp(score, 0, 100);
}

function scoreContentQuality(record: UrlRecord): number {
  const wordCount = record.wordCount ?? null;
  const hasTitle = !record.missingTitle;
  const hasH1 = !record.missingH1;

  let score = 50; // baseline when no data

  if (wordCount !== null) {
    if (wordCount >= 1500) score = 80;
    else if (wordCount >= 800) score = 65;
    else if (wordCount >= 300) score = 50;
    else if (wordCount >= 100) score = 30;
    else score = 10;
  }

  // Penalties for missing essentials
  if (!hasTitle) score -= 15;
  if (!hasH1) score -= 10;

  return clamp(score, 0, 100);
}

function scoreBacklinkValue(record: UrlRecord): number {
  const backlinks = record.backlinks ?? 0;
  const referringDomains = record.referringDomains ?? 0;

  // If no backlink data was fetched at all, give neutral score instead of penalizing
  if (record.backlinks === null && record.referringDomains === null) return 40;

  if (backlinks === 0 && referringDomains === 0) return 0;

  let score = 0;

  // Referring domains are more valuable than raw backlink count
  if (referringDomains > 0) {
    score += referringDomains >= 20 ? 70 : (referringDomains / 20) * 70;
  }

  // Raw backlinks as supplement
  if (backlinks > 0) {
    score += clamp(backlinks / 10, 0, 30);
  }

  return clamp(score, 0, 100);
}

function scoreInternalImportance(record: UrlRecord): number {
  const internalIn = record.internalLinksIn ?? 0;
  const internalOut = record.internalLinksOut ?? 0;

  if (internalIn === 0 && internalOut === 0) return 10;

  let score = 0;

  // Internal links pointing to this page
  if (internalIn >= 20) score += 70;
  else if (internalIn >= 10) score += 55;
  else if (internalIn >= 5) score += 40;
  else if (internalIn >= 1) score += 25;

  // Pages that link out have structural role
  if (internalOut >= 10) score += 20;
  else if (internalOut >= 5) score += 10;

  // Orphan pages get low score
  if (internalIn === 0) score = 5;

  return clamp(score, 0, 100);
}

function scoreTopicalRelevance(record: UrlRecord): number {
  const pageType = record.pageType ?? "unknown";

  // Without NLP/manual tagging, use page type as proxy
  const relevanceByType: Record<string, number> = {
    homepage: 90,
    core_service_page: 85,
    service_subpage: 75,
    location_page: 70,
    evergreen_guide: 70,
    blog_article: 55,
    faq_page: 60,
    legal_page: 50,
    utility_page: 45,
    category_tag_page: 30,
    author_page: 25,
    media_attachment: 15,
    old_campaign_page: 20,
    unknown: 40,
  };

  return relevanceByType[pageType] ?? 40;
}

function scoreTechnicalHealth(record: UrlRecord): number {
  let score = 70; // baseline

  const statusCode = record.statusCode ?? 200;

  if (statusCode === 200) score += 15;
  else if (statusCode === 301 || statusCode === 302) score -= 20;
  else if (statusCode >= 400) score -= 40;
  else if (statusCode >= 500) score -= 60;

  if (record.isIndexable === true) score += 10;
  else if (record.isIndexable === false) score -= 20;

  // Canonical consistency (normalize trailing slashes before comparing)
  if (record.canonical && record.canonical !== record.url) {
    const normCanonical = record.canonical.replace(/\/+$/, "").toLowerCase();
    const normUrl = record.url.replace(/\/+$/, "").toLowerCase();
    if (normCanonical !== normUrl) {
      score -= 15;
    }
  }

  return clamp(score, 0, 100);
}

export function computeScores(
  record: UrlRecord,
  weights: ScoreWeights,
  pageTypeModifiers: Record<string, number>
): { breakdown: ScoreBreakdown; totalScore: number } {
  const breakdown: ScoreBreakdown = {
    trafficValue: scoreTrafficValue(record),
    businessValue: scoreBusinessValue(record),
    contentQuality: scoreContentQuality(record),
    backlinkValue: scoreBacklinkValue(record),
    internalImportance: scoreInternalImportance(record),
    topicalRelevance: scoreTopicalRelevance(record),
    technicalHealth: scoreTechnicalHealth(record),
  };

  // Weighted total
  let totalScore =
    breakdown.trafficValue * weights.trafficValue +
    breakdown.businessValue * weights.businessValue +
    breakdown.contentQuality * weights.contentQuality +
    breakdown.backlinkValue * weights.backlinkValue +
    breakdown.internalImportance * weights.internalImportance +
    breakdown.topicalRelevance * weights.topicalRelevance +
    breakdown.technicalHealth * weights.technicalHealth;

  // Apply page type modifier
  const pageType = record.pageType ?? "unknown";
  const modifier = pageTypeModifiers[pageType] ?? 0;
  totalScore += modifier;

  totalScore = clamp(totalScore, 0, 100);

  return { breakdown, totalScore };
}
