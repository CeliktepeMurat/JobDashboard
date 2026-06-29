// Fetches LinkedIn job listings via the curious_coder/linkedin-jobs-scraper Apify actor.
//
// This actor doesn't accept keyword/location text directly — it takes LinkedIn
// job search URLs. We build the URLs ourselves using LinkedIn's public search
// query parameters, then pass them as the `urls` array input the actor expects.
//
// LinkedIn search URL params used:
//   keywords  — job title / search term
//   location  — city, country, or "Worldwide"
//   f_WT=2    — work type: remote only
//   f_TPR=r86400 — posted in the last 24 hours (keeps results fresh)

import { ApifyClient } from "apify-client";
import { prisma } from "@/lib/prisma";

const LINKEDIN_SEARCHES = [
  { keywords: "software engineer",   location: "Turkey" },
  { keywords: "full stack developer", location: "Turkey" },
  { keywords: "blockchain developer", location: "Worldwide" },
  { keywords: "remote software engineer", location: "Worldwide" },
];

function buildLinkedInUrl(keywords: string, location: string): string {
  const params = new URLSearchParams({
    keywords,
    location,
    f_WT: "2",       // remote only
    f_TPR: "r86400", // last 24 hours
  });
  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}

interface ApifyRawJob {
  id?: string;
  jobId?: string;
  title?: string;
  position?: string;
  company?: string;
  companyName?: string;
  location?: string;
  description?: string;
  jobDescription?: string;
  url?: string;
  link?: string;
  jobUrl?: string;
  postedAt?: string;
  publishedAt?: string;
  postedDate?: string;
}

export async function fetchAndStoreApifyJobs(): Promise<number> {
  const token   = process.env.APIFY_TOKEN;
  const actorId = process.env.APIFY_ACTOR_ID;

  if (!token)   throw new Error("APIFY_TOKEN is not set");
  if (!actorId) throw new Error("APIFY_ACTOR_ID is not set");

  const client = new ApifyClient({ token });

  // Build one URL per search and pass them all in a single actor run.
  // Running once with multiple URLs is cheaper than one run per search.
  const urls = LINKEDIN_SEARCHES.map((s) => buildLinkedInUrl(s.keywords, s.location));

  let items: ApifyRawJob[];

  try {
    const run = await client.actor(actorId).call({
      urls,
      maxResults: 25, // per URL
    });

    const dataset = await client
      .dataset(run.defaultDatasetId)
      .listItems({ limit: 200 });

    items = dataset.items as ApifyRawJob[];
  } catch (err) {
    throw err; // let the caller (fetch-jobs route) log and handle it
  }

  let totalUpserted = 0;

  for (const job of items) {
    const externalId  = String(job.id ?? job.jobId ?? "");
    const title       = job.title ?? job.position ?? "";
    const company     = job.company ?? job.companyName ?? "";
    const url         = job.url ?? job.link ?? job.jobUrl ?? "";
    const description = job.description ?? job.jobDescription ?? null;
    const postedAtRaw = job.postedAt ?? job.publishedAt ?? job.postedDate;
    const location    = job.location ?? null;

    if (!externalId || !title || !company || !url) continue;

    const postedAt = postedAtRaw ? new Date(postedAtRaw) : null;
    const validPostedAt = postedAt && !isNaN(postedAt.getTime()) ? postedAt : null;

    await prisma.job.upsert({
      where: { externalId },
      create:  { externalId, title, company, location, description, url, source: "APIFY", postedAt: validPostedAt },
      update:  { title, company, location, description, url, postedAt: validPostedAt },
    });

    totalUpserted++;
  }

  return totalUpserted;
}
