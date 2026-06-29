// Fetches LinkedIn job listings via curious_coder/linkedin-jobs-scraper on Apify.
//
// Per CLAUDE.md Job Search Preferences:
//   Keywords:  "full stack developer", "software engineer"
//   Workplace: All three — Remote, Hybrid, On-site (no f_WT filter)
//   Date:      Last 24 hours (f_TPR=r86400)
//   Location:  Turkey only — LinkedIn is the source covering Turkey-based roles
//              (Google Jobs has no Turkey coverage, so SerpApi handles international)
//
// The actor takes LinkedIn search URLs directly — not keyword/location text.
// We build the URLs ourselves and pass them as a string[] in the `urls` input field.

import { ApifyClient } from "apify-client";
import { prisma } from "@/lib/prisma";
import { scoreJob } from "@/lib/scoring";

const LINKEDIN_SEARCHES = [
  { keywords: "full stack developer", location: "Turkey" },
  { keywords: "software engineer",    location: "Turkey" },
];

function buildLinkedInUrl(keywords: string, location: string): string {
  const params = new URLSearchParams({
    keywords,
    location,
    f_TPR: "r86400", // last 24 hours
    // No f_WT filter — all workplace types: Remote, Hybrid, On-site
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

  const urls = LINKEDIN_SEARCHES.map((s) =>
    buildLinkedInUrl(s.keywords, s.location)
  );

  let items: ApifyRawJob[];

  try {
    const run = await client.actor(actorId).call({ urls, maxResults: 25 });
    const dataset = await client
      .dataset(run.defaultDatasetId)
      .listItems({ limit: 200 });
    items = dataset.items as ApifyRawJob[];
  } catch (err) {
    throw err;
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
    const relevanceScore = scoreJob(title, description);

    await prisma.job.upsert({
      where: { externalId },
      create:  { externalId, title, company, location, description, url, source: "APIFY", postedAt: validPostedAt, relevanceScore },
      update:  { title, company, location, description, url, postedAt: validPostedAt, relevanceScore },
    });

    totalUpserted++;
  }

  return totalUpserted;
}
