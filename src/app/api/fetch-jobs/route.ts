// POST /api/fetch-jobs
// Triggered daily by Vercel Cron (see vercel.json) or manually via POST request.
//
// Auth: In production, Vercel Cron sends Authorization: Bearer <CRON_SECRET>.
// In development (NODE_ENV !== "production"), auth is skipped so you can trigger
// the fetch from the UI or curl without needing a secret configured.

import { NextRequest, NextResponse } from "next/server";
import { fetchAndStoreSerpApiJobs } from "@/lib/fetchers/serpapi";
import { fetchAndStoreApifyJobs } from "@/lib/fetchers/apify";

export async function POST(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";

  if (!isDev) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const results = { serpapi: 0, apify: 0, errors: [] as string[] };

  try {
    results.serpapi = await fetchAndStoreSerpApiJobs();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.errors.push(`SerpApi: ${msg}`);
  }

  try {
    results.apify = await fetchAndStoreApifyJobs();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.errors.push(`Apify: ${msg}`);
  }

  return NextResponse.json(results, {
    status: results.errors.length > 0 ? 207 : 200,
  });
}
