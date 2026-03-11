/**
 * Simple robots.txt parser.
 * Checks if a given URL path is allowed for a user-agent.
 */

interface RobotsRule {
  type: "allow" | "disallow";
  path: string;
}

interface RobotsData {
  rules: RobotsRule[];
  sitemaps: string[];
}

export async function fetchRobotsTxt(domain: string): Promise<RobotsData> {
  const url = `https://${domain}/robots.txt`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "IndexMapper/1.0" },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { rules: [], sitemaps: [] };
    }

    const text = await response.text();
    return parseRobotsTxt(text);
  } catch {
    return { rules: [], sitemaps: [] };
  }
}

function parseRobotsTxt(content: string): RobotsData {
  const lines = content.split("\n");
  const rules: RobotsRule[] = [];
  const sitemaps: string[] = [];
  let isRelevantAgent = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;

    const [directive, ...valueParts] = trimmed.split(":");
    const value = valueParts.join(":").trim();

    const lowerDirective = directive.toLowerCase().trim();

    if (lowerDirective === "user-agent") {
      isRelevantAgent = value === "*" || value.toLowerCase().includes("indexmapper");
    } else if (lowerDirective === "disallow" && isRelevantAgent && value) {
      rules.push({ type: "disallow", path: value });
    } else if (lowerDirective === "allow" && isRelevantAgent && value) {
      rules.push({ type: "allow", path: value });
    } else if (lowerDirective === "sitemap" && value) {
      sitemaps.push(value);
    }
  }

  return { rules, sitemaps };
}

export function isPathAllowed(path: string, rules: RobotsRule[]): boolean {
  if (rules.length === 0) return true;

  let result = true;
  let longestMatch = 0;

  for (const rule of rules) {
    if (path.startsWith(rule.path) && rule.path.length >= longestMatch) {
      longestMatch = rule.path.length;
      result = rule.type === "allow";
    }
  }

  return result;
}
