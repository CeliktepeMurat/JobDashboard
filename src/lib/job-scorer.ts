// Server-only job scorer — reads scoring-rules.md from the project root.
// Do NOT import this file from client components (it uses Node's `fs`).
// Client components should only import `relevanceLabel` from `@/lib/scoring`.

import fs from "fs";
import path from "path";

interface ParsedRules {
  eliminate: RegExp[];
  blockedCompanies: RegExp[];
  core: RegExp[][];             // synonym groups → +2 each
  secondary: RegExp[][];        // synonym groups → +1 each
  blockchain: RegExp[][];       // synonym groups → +2 each (blockchain jobs only)
}

// Indicator regex: if a job matches this, the blockchain skills block is enabled.
const BLOCKCHAIN_INDICATORS =
  /blockchain|web3|solidity|defi|nft|crypto|smart.?contract|wagmi|viem/i;

// Parse scoring-rules.md once at module load — cached for the server process lifetime.
// To pick up edits, restart the dev server.
const RULES: ParsedRules = parseRulesFile();

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Matches `pattern` as a whole word/phrase — bounded by non-alphanumeric characters
// or string edges — so a short pattern like "java" matches "Java Developer" and
// "Software Engineer, Java" but NOT inside "JavaScript". Case-insensitive.
function buildPatternRegex(pattern: string): RegExp {
  return new RegExp(`(?<![a-z0-9])${escapeRegex(pattern)}(?![a-z0-9])`, "i");
}

function parseRulesFile(): ParsedRules {
  const filePath = path.join(process.cwd(), "scoring-rules.md");
  const rules: ParsedRules = { eliminate: [], blockedCompanies: [], core: [], secondary: [], blockchain: [] };

  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    console.warn("scoring-rules.md not found — using empty rule set");
    return rules;
  }

  type Section = "eliminate" | "blockedCompanies" | "core" | "secondary" | "blockchain" | "";
  let section: Section = "";

  for (const raw of content.split("\n")) {
    const line = raw.trim();

    // Detect ## section headers
    const sectionMatch = line.match(/^##\s+(.+)/);
    if (sectionMatch) {
      const name = sectionMatch[1].toLowerCase();
      if (name.includes("compan"))          section = "blockedCompanies";
      else if (name.includes("eliminat"))   section = "eliminate";
      else if (name.includes("core"))       section = "core";
      else if (name.includes("second"))     section = "secondary";
      else if (name.includes("blockchain")) section = "blockchain";
      else                                  section = "";
      continue;
    }

    // Only process list items
    if (!section || !line.startsWith("- ")) continue;
    const item = line.slice(2).trim();
    if (!item) continue;

    if (section === "eliminate" || section === "blockedCompanies") {
      rules[section].push(buildPatternRegex(item));
    } else {
      // Split by comma → synonym group
      const synonyms = item
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      rules[section].push(synonyms.map(buildPatternRegex));
    }
  }

  return rules;
}

export interface ScoreResult {
  score: number;
  // true if the company is blocked or an elimination pattern matched — the
  // fetcher should omit the job entirely (not store it), not just score it low.
  blocked: boolean;
}

/**
 * Scores a job against the rules loaded from scoring-rules.md.
 *
 * `blocked: true` means the company is on the block list or an elimination
 * pattern matched the title/description — the caller should skip storing
 * this job at all, not merely hide it behind a relevance filter. Otherwise
 * returns a keyword score: core +2, secondary +1, blockchain +2.
 */
export function scoreJob(title: string, description: string | null, company?: string | null): ScoreResult {
  if (company) {
    for (const pattern of RULES.blockedCompanies) {
      if (pattern.test(company)) return { score: 0, blocked: true };
    }
  }

  const text = `${title} ${description ?? ""}`;

  // Elimination check — any match → immediate omit
  for (const pattern of RULES.eliminate) {
    if (pattern.test(text)) return { score: 0, blocked: true };
  }

  let score = 0;

  for (const variants of RULES.core) {
    if (variants.some((v) => v.test(text))) score += 2;
  }

  for (const variants of RULES.secondary) {
    if (variants.some((v) => v.test(text))) score += 1;
  }

  if (BLOCKCHAIN_INDICATORS.test(text)) {
    for (const variants of RULES.blockchain) {
      if (variants.some((v) => v.test(text))) score += 2;
    }
  }

  return { score, blocked: false };
}
