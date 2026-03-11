import type { NormalizedUrlData } from "@/types";

export function mergeRecords(
  allRecords: NormalizedUrlData[]
): NormalizedUrlData[] {
  const byUrl = new Map<string, NormalizedUrlData[]>();

  for (const record of allRecords) {
    const existing = byUrl.get(record.url) || [];
    existing.push(record);
    byUrl.set(record.url, existing);
  }

  const merged: NormalizedUrlData[] = [];

  for (const [url, records] of byUrl) {
    if (records.length === 1) {
      merged.push(records[0]);
      continue;
    }

    // Merge multiple records for the same URL
    const mergedRecord: NormalizedUrlData = {
      url,
      urlRaw: records[0].urlRaw,
      dataSources: [...new Set(records.flatMap((r) => r.dataSources))],
    };

    // For each field, take the first non-null value
    for (const record of records) {
      mergedRecord.statusCode ??= record.statusCode;
      mergedRecord.indexability ??= record.indexability;
      mergedRecord.canonical ??= record.canonical;
      mergedRecord.title ??= record.title;
      mergedRecord.h1 ??= record.h1;
      mergedRecord.wordCount ??= record.wordCount;
      mergedRecord.clicks ??= record.clicks;
      mergedRecord.impressions ??= record.impressions;
      mergedRecord.ctr ??= record.ctr;
      mergedRecord.position ??= record.position;
      mergedRecord.sessions ??= record.sessions;
      mergedRecord.bounceRate ??= record.bounceRate;
      mergedRecord.conversions ??= record.conversions;
      mergedRecord.backlinks ??= record.backlinks;
      mergedRecord.referringDomains ??= record.referringDomains;
      mergedRecord.internalLinksIn ??= record.internalLinksIn;
      mergedRecord.internalLinksOut ??= record.internalLinksOut;
      mergedRecord.lastModified ??= record.lastModified;
    }

    merged.push(mergedRecord);
  }

  return merged;
}
