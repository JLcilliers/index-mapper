import type { PageType } from "@/types";

interface PageTypePattern {
  type: PageType;
  urlPatterns: RegExp[];
  titlePatterns?: RegExp[];
}

const PAGE_TYPE_PATTERNS: PageTypePattern[] = [
  {
    type: "homepage",
    urlPatterns: [/^https?:\/\/[^/]+\/?$/],
  },
  {
    type: "legal_page",
    urlPatterns: [
      /\/(privacy|terms|disclaimer|cookie|gdpr|legal|compliance|accessibility)/i,
    ],
    titlePatterns: [/privacy\s*policy|terms\s*(of|&)\s*(service|use)|disclaimer/i],
  },
  {
    type: "location_page",
    urlPatterns: [
      /\/locations?\//i,
      /\/cities?\//i,
      /\/areas?\//i,
      /\/service-area/i,
      /\/(dentist|doctor|lawyer|plumber|electrician)-in-/i,
    ],
  },
  {
    type: "blog_article",
    urlPatterns: [/\/blog\//i, /\/posts?\//i, /\/articles?\//i, /\/news\//i],
  },
  {
    type: "evergreen_guide",
    urlPatterns: [
      /\/guide/i,
      /\/how-to-/i,
      /\/what-is-/i,
      /\/ultimate-guide/i,
      /\/complete-guide/i,
    ],
  },
  {
    type: "faq_page",
    urlPatterns: [/\/faq/i, /\/frequently-asked/i, /\/questions/i],
  },
  {
    type: "category_tag_page",
    urlPatterns: [
      /\/category\//i,
      /\/tag\//i,
      /\/topics?\//i,
      /\/archive/i,
    ],
  },
  {
    type: "author_page",
    urlPatterns: [/\/author\//i, /\/team\//i, /\/staff\//i],
  },
  {
    type: "media_attachment",
    urlPatterns: [
      /\/attachment\//i,
      /\/wp-content\/uploads/i,
      /\.(jpg|jpeg|png|gif|pdf|svg|webp)$/i,
    ],
  },
  {
    type: "old_campaign_page",
    urlPatterns: [
      /\/campaign/i,
      /\/promo/i,
      /\/offer\//i,
      /\/special\//i,
      /\/landing\//i,
      /\/(2018|2019|2020|2021|2022)\//i,
    ],
  },
  {
    type: "utility_page",
    urlPatterns: [
      /\/contact/i,
      /\/about/i,
      /\/sitemap/i,
      /\/search/i,
      /\/login/i,
      /\/register/i,
      /\/404/i,
      /\/thank-you/i,
    ],
  },
  {
    type: "core_service_page",
    urlPatterns: [
      /\/services?\/?$/i,
      /\/solutions?\/?$/i,
      /\/what-we-do\/?$/i,
    ],
  },
  {
    type: "service_subpage",
    urlPatterns: [
      /\/services?\/.+/i,
      /\/solutions?\/.+/i,
    ],
  },
];

export function detectPageType(
  url: string,
  title?: string | null
): PageType {
  for (const pattern of PAGE_TYPE_PATTERNS) {
    for (const urlPattern of pattern.urlPatterns) {
      if (urlPattern.test(url)) {
        return pattern.type;
      }
    }
    if (title && pattern.titlePatterns) {
      for (const titlePattern of pattern.titlePatterns) {
        if (titlePattern.test(title)) {
          return pattern.type;
        }
      }
    }
  }
  return "unknown";
}
