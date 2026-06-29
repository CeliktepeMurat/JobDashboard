// Fetches remote job listings from SerpApi using the Google Jobs engine.
//
// Per CLAUDE.md Job Search Preferences:
//   Keywords:  "blockchain developer", "full stack developer", "software engineer"
//   Workplace: Remote only (chips: "work_from_home:1" — keeps "remote" out of
//              the keyword so results aren't artificially narrowed by phrasing)
//   Location:  United States — used as a proxy for the full international remote
//              pool; Google Jobs returns almost nothing for Turkey-based queries
//
// Each query costs 1 SerpApi credit. Free tier: 250/month.
// 3 queries × ~30 days = 90 credits/month, well within the free tier.

import { getJson } from "serpapi";
import { prisma } from "@/lib/prisma";
import { scoreJob } from "@/lib/scoring";

const QUERIES = [
  "blockchain developer",
  "full stack developer",
  "software engineer",
];

interface SerpApiJob {
  job_id: string;
  title: string;
  company_name: string;
  location: string;
  description: string;
  detected_extensions?: { posted_at?: string };
  apply_options?: { title: string; link: string }[];
}

export async function fetchAndStoreSerpApiJobs(): Promise<number> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error("SERPAPI_KEY is not set");

  let totalUpserted = 0;

  for (const query of QUERIES) {
    let results: SerpApiJob[];

    try {
      const data = await getJson({
        engine: "google_jobs",
        q: query,
        location: "United States",
        chips: "work_from_home:1", // remote only — per Job Search Preferences
        api_key: apiKey,
        hl: "en",
      });

      results = (data.jobs_results as SerpApiJob[] | undefined) ?? [];
    } catch (err) {
      console.error(`SerpApi error for query "${query}":`, err);
      continue;
    }

    for (const job of results) {
      if (!job.job_id || !job.title || !job.company_name) continue;

      const url =
        job.apply_options?.[0]?.link ??
        `https://www.google.com/search?q=${encodeURIComponent(job.title + " " + job.company_name)}`;

      const postedAtRaw = job.detected_extensions?.posted_at;
      const postedAt = postedAtRaw ? parseSerpApiDate(postedAtRaw) : null;
      const relevanceScore = scoreJob(job.title, job.description ?? null);

      await prisma.job.upsert({
        where: { externalId: job.job_id },
        create: {
          externalId: job.job_id,
          title: job.title,
          company: job.company_name,
          location: job.location ?? null,
          description: job.description ?? null,
          url,
          source: "SERPAPI",
          postedAt,
          relevanceScore,
        },
        update: {
          title: job.title,
          company: job.company_name,
          location: job.location ?? null,
          description: job.description ?? null,
          url,
          postedAt,
          relevanceScore,
        },
      });

      totalUpserted++;
    }
  }

  return totalUpserted;
}

// Converts SerpApi's relative date strings ("3 days ago", "today", etc.)
// into a Date by subtracting from now. Returns null for unrecognised formats.
function parseSerpApiDate(raw: string): Date | null {
  const now = new Date();
  const s = raw.toLowerCase().trim();

  if (s === "today" || s === "just now") return now;

  const match = s.match(/^(\d+)\s+(hour|day|week|month)s?\s+ago$/);
  if (!match) return null;

  const amount = parseInt(match[1], 10);
  const unit   = match[2];
  const result = new Date(now);

  if      (unit === "hour")  result.setHours(result.getHours() - amount);
  else if (unit === "day")   result.setDate(result.getDate() - amount);
  else if (unit === "week")  result.setDate(result.getDate() - amount * 7);
  else if (unit === "month") result.setMonth(result.getMonth() - amount);

  return result;
}
