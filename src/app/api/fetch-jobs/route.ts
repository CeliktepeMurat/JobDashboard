// POST /api/fetch-jobs
// Triggered daily by Vercel Cron (see vercel.json) or manually via POST request.
//
// Auth: In production, Vercel Cron sends Authorization: Bearer <CRON_SECRET>.
// In development (NODE_ENV !== "production"), auth is skipped so you can trigger
// the fetch from the UI or curl without needing a secret configured.

import { NextRequest, NextResponse } from "next/server";
import { fetchAndStoreSerpApiJobs } from "@/lib/fetchers/serpapi";
import { fetchAndStoreApifyJobs } from "@/lib/fetchers/apify";

// Registry of job sources. To bring a source online or take it offline, flip
// `enabled` here — no need to touch the fetch loop below. To add a new source
// later, write a fetcher (see src/lib/fetchers/apify.ts for the shape) and add
// an entry here.
const SOURCES: { label: string; enabled: boolean; fetch: () => Promise<number> }[] = [
  { label: "LinkedIn",    enabled: true,  fetch: fetchAndStoreApifyJobs },
  { label: "Google Jobs", enabled: false, fetch: fetchAndStoreSerpApiJobs },
];

export async function POST(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";

  if (!isDev) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const results: Record<string, number> = {};
  const errors: string[] = [];

  for (const source of SOURCES.filter((s) => s.enabled)) {
    try {
      results[source.label] = await source.fetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${source.label}: ${msg}`);
    }
  }

  return NextResponse.json({ results, errors }, {
    status: errors.length > 0 ? 207 : 200,
  });
}
