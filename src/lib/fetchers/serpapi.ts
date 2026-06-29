// Fetches remote job listings from SerpApi using the Google Jobs engine.
//
// Why location: "United States"?
// Google Jobs has almost zero coverage for Turkey, so SerpApi is used purely
// for international remote roles. Passing "United States" as the location
// forces Google Jobs to return the broadest international remote listings
// regardless of where the user is physically located.
//
// This module is server-side only — SERPAPI_KEY must never reach the browser.

import { getJson } from "serpapi";
import { prisma } from "@/lib/prisma";

// Queries to run. Each costs 1 SerpApi credit (free tier: 250/month).
// Keep this list short to stay within the free tier.
const QUERIES = [
  "software engineer remote",
  "full stack developer remote",
  "frontend developer remote",
  "backend developer remote",
  "blockchain developer remote",
];

interface SerpApiJob {
  job_id: string;
  title: string;
  company_name: string;
  location: string;
  description: string;
  detected_extensions?: {
    posted_at?: string;
  };
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
        api_key: apiKey,
        hl: "en",
      });

      results = (data.jobs_results as SerpApiJob[] | undefined) ?? [];
    } catch (err) {
      console.error(`SerpApi error for query "${query}":`, err);
      continue; // skip this query, try the next
    }

    for (const job of results) {
      // Validate the minimum required fields before saving
      if (!job.job_id || !job.title || !job.company_name) continue;

      // Best-effort: grab the first apply link, fall back to a search URL
      const url =
        job.apply_options?.[0]?.link ??
        `https://www.google.com/search?q=${encodeURIComponent(job.title + " " + job.company_name)}`;

      // Parse posted_at ("3 days ago", "today", etc.) — stored as a string hint,
      // not a precise timestamp, because SerpApi doesn't give exact dates.
      const postedAtRaw = job.detected_extensions?.posted_at;
      const postedAt = postedAtRaw ? parseSerpApiDate(postedAtRaw) : null;

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
        },
        update: {
          title: job.title,
          company: job.company_name,
          location: job.location ?? null,
          description: job.description ?? null,
          url,
          postedAt,
        },
      });

      totalUpserted++;
    }
  }

  return totalUpserted;
}

// Converts SerpApi's relative date strings ("3 days ago", "today", "2 hours ago")
// into a Date object by working backwards from now.
// Returns null if the format isn't recognized rather than throwing.
function parseSerpApiDate(raw: string): Date | null {
  const now = new Date();
  const s = raw.toLowerCase().trim();

  if (s === "today" || s === "just now") return now;

  const match = s.match(/^(\d+)\s+(hour|day|week|month)s?\s+ago$/);
  if (!match) return null;

  const amount = parseInt(match[1], 10);
  const unit = match[2];
  const result = new Date(now);

  if (unit === "hour") result.setHours(result.getHours() - amount);
  else if (unit === "day") result.setDate(result.getDate() - amount);
  else if (unit === "week") result.setDate(result.getDate() - amount * 7);
  else if (unit === "month") result.setMonth(result.getMonth() - amount);

  return result;
}
