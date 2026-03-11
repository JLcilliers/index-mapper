import type { ColumnMapping, FileType } from "@/types";

interface ColumnPattern {
  field: keyof ColumnMapping;
  patterns: RegExp[];
}

const COLUMN_PATTERNS: ColumnPattern[] = [
  {
    field: "url",
    patterns: [
      /^url$/i,
      /^address$/i,
      /^page$/i,
      /^landing\s*page$/i,
      /^page\s*path$/i,
      /^loc$/i,
      /^location$/i,
      /^page\s*url$/i,
      /^top\s*pages$/i,
    ],
  },
  {
    field: "statusCode",
    patterns: [/^status\s*code$/i, /^status$/i, /^http\s*status$/i, /^response\s*code$/i],
  },
  {
    field: "indexability",
    patterns: [/^indexability$/i, /^indexable$/i, /^index\s*status$/i],
  },
  {
    field: "canonical",
    patterns: [/^canonical$/i, /^canonical\s*link$/i, /^canonical\s*url$/i],
  },
  {
    field: "title",
    patterns: [/^title$/i, /^title\s*1$/i, /^page\s*title$/i, /^meta\s*title$/i, /^seo\s*title$/i],
  },
  {
    field: "h1",
    patterns: [/^h1$/i, /^h1[-_]1$/i, /^heading\s*1$/i, /^h1\s*tag$/i],
  },
  {
    field: "wordCount",
    patterns: [/^word\s*count$/i, /^words$/i, /^content\s*length$/i],
  },
  {
    field: "clicks",
    patterns: [/^clicks$/i, /^organic\s*clicks$/i, /^total\s*clicks$/i],
  },
  {
    field: "impressions",
    patterns: [/^impressions$/i, /^organic\s*impressions$/i, /^total\s*impressions$/i],
  },
  {
    field: "ctr",
    patterns: [/^ctr$/i, /^click\s*through\s*rate$/i, /^avg\.?\s*ctr$/i],
  },
  {
    field: "position",
    patterns: [/^position$/i, /^avg\.?\s*position$/i, /^average\s*position$/i, /^rank$/i],
  },
  {
    field: "sessions",
    patterns: [/^sessions$/i, /^visits$/i, /^organic\s*sessions$/i],
  },
  {
    field: "bounceRate",
    patterns: [/^bounce\s*rate$/i, /^bounce$/i],
  },
  {
    field: "conversions",
    patterns: [
      /^conversions$/i,
      /^goals?\s*completions?$/i,
      /^transactions$/i,
      /^leads$/i,
      /^goal\s*conversion/i,
    ],
  },
  {
    field: "backlinks",
    patterns: [/^backlinks$/i, /^external\s*backlinks$/i, /^inlinks$/i, /^total\s*backlinks$/i],
  },
  {
    field: "referringDomains",
    patterns: [/^referring\s*domains$/i, /^ref\.?\s*domains$/i, /^linking\s*domains$/i, /^domains$/i],
  },
  {
    field: "internalLinksIn",
    patterns: [
      /^internal\s*links?\s*in$/i,
      /^inlinks$/i,
      /^unique\s*inlinks$/i,
      /^internal\s*inlinks$/i,
    ],
  },
  {
    field: "internalLinksOut",
    patterns: [
      /^internal\s*links?\s*out$/i,
      /^outlinks$/i,
      /^unique\s*outlinks$/i,
      /^internal\s*outlinks$/i,
    ],
  },
  {
    field: "lastModified",
    patterns: [/^last\s*modified$/i, /^lastmod$/i, /^date\s*modified$/i, /^modified$/i],
  },
];

export function mapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};

  for (const pattern of COLUMN_PATTERNS) {
    for (const header of headers) {
      const trimmed = header.trim();
      for (const regex of pattern.patterns) {
        if (regex.test(trimmed)) {
          mapping[pattern.field] = header;
          break;
        }
      }
      if (mapping[pattern.field]) break;
    }
  }

  return mapping;
}

export function detectFileType(headers: string[]): FileType {
  const headerSet = new Set(headers.map((h) => h.toLowerCase().trim()));

  // Screaming Frog crawl
  if (headerSet.has("address") && headerSet.has("status code") && headerSet.has("indexability")) {
    return "crawl";
  }

  // GSC export
  if (
    (headerSet.has("page") || headerSet.has("top pages")) &&
    headerSet.has("clicks") &&
    headerSet.has("impressions")
  ) {
    return "gsc";
  }

  // GA export
  if (
    (headerSet.has("landing page") || headerSet.has("page path")) &&
    headerSet.has("sessions")
  ) {
    return "ga";
  }

  // Backlinks export
  if (
    headerSet.has("referring domains") ||
    headerSet.has("backlinks") ||
    headerSet.has("domain rating")
  ) {
    return "backlinks";
  }

  // Sitemap
  if (headerSet.has("loc") || headerSet.has("lastmod")) {
    return "sitemap";
  }

  return "unknown";
}
