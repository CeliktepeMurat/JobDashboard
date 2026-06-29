// POST /api/fetch-jobs — triggered by Vercel Cron (or manually) to fetch fresh jobs
// from SerpApi and Apify, then upsert them into the DB.
// This route is protected — only called server-side via cron, not from the browser.
import { NextRequest, NextResponse } from "next/server";

// TODO: import serpapi and apify fetchers once implemented
// import { fetchSerpApiJobs } from "@/lib/fetchers/serpapi";
// import { fetchApifyJobs } from "@/lib/fetchers/apify";

export async function POST(request: NextRequest) {
  // Verify the request comes from Vercel Cron (or our own secret)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: call fetchers and upsert results once implemented
  return NextResponse.json({ message: "fetch-jobs endpoint ready — fetchers not yet wired" });
}
