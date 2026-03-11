import Papa from "papaparse";
import type { ColumnMapping, NormalizedUrlData, FileType } from "@/types";
import { mapColumns, detectFileType } from "./column-mapper";
import {
  normalizeUrl,
  parseNumber,
  parseDate,
  cleanString,
} from "./normalizer";

export interface ParseResult {
  records: NormalizedUrlData[];
  fileType: FileType;
  columnMapping: ColumnMapping;
  rowCount: number;
  errors: string[];
}

export function parseCSV(csvContent: string, fileName: string): ParseResult {
  const errors: string[] = [];

  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    for (const err of parsed.errors.slice(0, 10)) {
      errors.push(`Row ${err.row}: ${err.message}`);
    }
  }

  const headers = parsed.meta.fields || [];
  const columnMapping = mapColumns(headers);
  const fileType = detectFileType(headers);

  if (!columnMapping.url) {
    errors.push(`No URL column detected in ${fileName}. Headers found: ${headers.join(", ")}`);
    return { records: [], fileType, columnMapping, rowCount: 0, errors };
  }

  const records: NormalizedUrlData[] = [];
  const rows = parsed.data as Record<string, string>[];

  for (const row of rows) {
    const rawUrl = row[columnMapping.url!];
    if (!rawUrl || rawUrl.trim() === "") continue;

    const url = normalizeUrl(rawUrl);

    const record: NormalizedUrlData = {
      url,
      urlRaw: rawUrl.trim(),
      statusCode: columnMapping.statusCode
        ? parseNumber(row[columnMapping.statusCode])
        : null,
      indexability: columnMapping.indexability
        ? cleanString(row[columnMapping.indexability])
        : null,
      canonical: columnMapping.canonical
        ? cleanString(row[columnMapping.canonical])
        : null,
      title: columnMapping.title
        ? cleanString(row[columnMapping.title])
        : null,
      h1: columnMapping.h1 ? cleanString(row[columnMapping.h1]) : null,
      wordCount: columnMapping.wordCount
        ? parseNumber(row[columnMapping.wordCount])
        : null,
      clicks: columnMapping.clicks
        ? parseNumber(row[columnMapping.clicks])
        : null,
      impressions: columnMapping.impressions
        ? parseNumber(row[columnMapping.impressions])
        : null,
      ctr: columnMapping.ctr
        ? parseNumber(row[columnMapping.ctr])
        : null,
      position: columnMapping.position
        ? parseNumber(row[columnMapping.position])
        : null,
      sessions: columnMapping.sessions
        ? parseNumber(row[columnMapping.sessions])
        : null,
      bounceRate: columnMapping.bounceRate
        ? parseNumber(row[columnMapping.bounceRate])
        : null,
      conversions: columnMapping.conversions
        ? parseNumber(row[columnMapping.conversions])
        : null,
      backlinks: columnMapping.backlinks
        ? parseNumber(row[columnMapping.backlinks])
        : null,
      referringDomains: columnMapping.referringDomains
        ? parseNumber(row[columnMapping.referringDomains])
        : null,
      internalLinksIn: columnMapping.internalLinksIn
        ? parseNumber(row[columnMapping.internalLinksIn])
        : null,
      internalLinksOut: columnMapping.internalLinksOut
        ? parseNumber(row[columnMapping.internalLinksOut])
        : null,
      lastModified: columnMapping.lastModified
        ? parseDate(row[columnMapping.lastModified])
        : null,
      dataSources: [fileType],
    };

    records.push(record);
  }

  return {
    records,
    fileType,
    columnMapping,
    rowCount: records.length,
    errors,
  };
}
