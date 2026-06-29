// Scores a job listing against the developer's skills profile (from CLAUDE.md).
//
// Approach: simple case-insensitive substring match with a synonym list.
// No NLP, no embeddings — a personal tracker doesn't need it and it would
// be hard to explain in an interview. Keep it simple.
//
// Scoring:
//   Core skill match  → +2 points each
//   Secondary match   → +1 point each
//   Blockchain match  → +2 each (only when the job is blockchain-related)
//
// Thresholds → label:
//   >= 6  → "High"
//   >= 2  → "Medium"
//   <  2  → "Low"

export type RelevanceLabel = "High" | "Medium" | "Low";

// Each entry is a list of synonyms — any match counts as one skill hit.
const CORE_SKILLS: string[][] = [
  ["typescript", " ts "],
  ["javascript", " js "],
  ["node.js", "nodejs", "node js"],
  ["react"],
  ["next.js", "nextjs", "next js"],
  ["nestjs", "nest.js", "nest js"],
  ["rest api", "restful", "rest apis"],
  ["graphql"],
  ["postgresql", "postgres"],
  ["redis"],
];

const SECONDARY_SKILLS: string[][] = [
  ["react native"],
  ["redux"],
  ["tailwind"],
  ["mongodb"],
  ["docker"],
  ["aws", "amazon web services"],
  ["lambda"],
  ["ci/cd", "cicd", "github actions"],
];

const BLOCKCHAIN_SKILLS: string[][] = [
  ["solidity"],
  ["foundry"],
  ["hardhat"],
  ["web3"],
  ["smart contract"],
  ["viem"],
  ["wagmi"],
  ["the graph"],
];

// Indicators that a job is blockchain-related — enables the blockchain skills block
const BLOCKCHAIN_INDICATORS = /blockchain|web3|solidity|defi|nft|crypto|smart.?contract|wagmi|viem/i;

export function scoreJob(title: string, description: string | null): number {
  const text = ` ${title} ${description ?? ""} `.toLowerCase();
  let score = 0;

  for (const variants of CORE_SKILLS) {
    if (variants.some((v) => text.includes(v))) score += 2;
  }

  for (const variants of SECONDARY_SKILLS) {
    if (variants.some((v) => text.includes(v))) score += 1;
  }

  // Only add blockchain skill points if the job is actually about blockchain —
  // no point penalising pure full-stack jobs for not mentioning Solidity
  if (BLOCKCHAIN_INDICATORS.test(text)) {
    for (const variants of BLOCKCHAIN_SKILLS) {
      if (variants.some((v) => text.includes(v))) score += 2;
    }
  }

  return score;
}

export function relevanceLabel(score: number): RelevanceLabel {
  if (score >= 6) return "High";
  if (score >= 2) return "Medium";
  return "Low";
}
