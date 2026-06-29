// POST /api/fetch-jobs
// Triggered daily by Vercel Cron (see vercel.json) or manually via POST request.
// Runs both fetchers (SerpApi + Apify) and upserts results into the DB.
//
// Cron auth: Vercel sets an Authorization: Bearer <CRON_SECRET> header on cron
// invocations. We check this so the endpoint isn't callable by anyone on the internet.
// For manual triggering during development: pass the same header yourself.

import { NextRequest, NextResponse } from "next/server";
import { fetchAndStoreSerpApiJobs } from "@/lib/fetchers/serpapi";
import { fetchAndStoreApifyJobs } from "@/lib/fetchers/apify";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
