import type { NormalizedUrlData } from "@/types";
import { detectPageType } from "../classification/page-types";

export interface EnrichedUrlData extends NormalizedUrlData {
  pageType: string;
  isIndexable: boolean | null;
  isOrphan: boolean | null;
  isThinContent: boolean | null;
  hasBacklinks: boolean;
  hasConversions: boolean;
  hasTraffic: boolean;
  missingTitle: boolean;
  missingH1: boolean;
  dataCompleteness: number;
}

export function computeDerivedFields(
  record: NormalizedUrlData
): EnrichedUrlData {
  const pageType = detectPageType(record.url, record.title);

  const isIndexable = computeIsIndexable(record);
  const isOrphan = record.internalLinksIn !== null && record.internalLinksIn !== undefined
    ? record.internalLinksIn === 0
    : null;
  const isThinContent = record.wordCount !== null && record.wordCount !== undefined
    ? record.wordCount < 200
    : null;
  const hasBacklinks =
    (record.backlinks !== null && record.backlinks !== undefined && record.backlinks > 0) ||
    (record.referringDomains !== null && record.referringDomains !== undefined && record.referringDomains > 0);
  const hasConversions =
    record.conversions !== null && record.conversions !== undefined && record.conversions > 0;
  const hasTraffic =
    (record.clicks !== null && record.clicks !== undefined && record.clicks > 0) ||
    (record.sessions !== null && record.sessions !== undefined && record.sessions > 0);
  const missingTitle = !record.title;
  const missingH1 = !record.h1;
  const dataCompleteness = computeDataCompleteness(record);

  return {
    ...record,
    pageType,
    isIndexable,
    isOrphan,
    isThinContent,
    hasBacklinks,
    hasConversions,
    hasTraffic,
    missingTitle,
    missingH1,
    dataCompleteness,
  };
}

function computeIsIndexable(record: NormalizedUrlData): boolean | null {
  if (record.indexability) {
    const lower = record.indexability.toLowerCase();
    if (lower === "indexable" || lower === "yes" || lower === "true") return true;
    if (lower === "non-indexable" || lower === "noindex" || lower === "no" || lower === "false")
      return false;
  }

  if (record.statusCode) {
    if (record.statusCode === 200) return true;
    if (record.statusCode >= 300) return false;
  }

  return null;
}

function computeDataCompleteness(record: NormalizedUrlData): number {
  const fields = [
    record.statusCode,
    record.indexability,
    record.title,
    record.h1,
    record.wordCount,
    record.clicks,
    record.impressions,
    record.sessions,
    record.conversions,
    record.backlinks,
    record.internalLinksIn,
    record.canonical,
  ];

  const available = fields.filter(
    (f) => f !== null && f !== undefined
  ).length;

  return available / fields.length;
}
