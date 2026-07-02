// Client-safe scoring helpers — safe to import from both server and client components.
//
// For the actual job scoring logic (reading scoring-rules.md, keyword matching),
// see src/lib/job-scorer.ts (server-only).
//
// Thresholds match the keyword scoring scale from job-scorer.ts:
//   >= 6  → "High"    (3+ core skill matches)
//   >= 2  → "Medium"  (1+ core or 2+ secondary matches)
//   0–1   → "Low"     (no meaningful match, or eliminated by a rule)

export type RelevanceLabel = "High" | "Medium" | "Low";

export function relevanceLabel(score: number): RelevanceLabel {
  if (score >= 6) return "High";
  if (score >= 2) return "Medium";
  return "Low";
}
