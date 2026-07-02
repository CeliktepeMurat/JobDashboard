// Fetches LinkedIn job listings via curious_coder/linkedin-jobs-scraper on Apify.
// This is currently the only active job source — see src/app/api/fetch-jobs/route.ts
// for the source registry that makes adding another source later a small diff.
//
// Per CLAUDE.md Job Search Preferences:
//   1. "full stack developer", Turkey, all workplace types (Remote/Hybrid/On-site)
//   2. "software engineer",    Turkey, all workplace types
//   3. "blockchain developer", Worldwide, remote only (f_WT=2)
//   All searches: last 24 hours (f_TPR=r86400)
//
// The actor takes LinkedIn search URLs directly — not keyword/location text.
// We build the URLs ourselves and pass them as a string[] in the `urls` input field.

import { ApifyClient } from "apify-client";
import { prisma } from "@/lib/prisma";
import { scoreJob } from "@/lib/job-scorer";

interface LinkedInSearch {
  keywords: string;
  location: string;
  remoteOnly?: boolean;
}

const LINKEDIN_SEARCHES: LinkedInSearch[] = [
  { keywords: "full stack developer", location: "Turkey" },
  { keywords: "software engineer",    location: "Turkey" },
  { keywords: "blockchain developer", location: "Worldwide", remoteOnly: true },
];

function buildLinkedInUrl(search: LinkedInSearch): string {
  const params = new URLSearchParams({
    keywords: search.keywords,
    location: search.location,
    f_TPR: "r86400", // last 24 hours
  });
  // f_WT=2 is LinkedIn's "Remote" workplace-type filter (1=On-site, 3=Hybrid).
  // Omitted for searches that should include all workplace types.
  if (search.remoteOnly) params.set("f_WT", "2");
  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}

// Field names confirmed against the actor's actual output schema (checked 2026-07-02) —
// it returns descriptionText/descriptionHtml, not description/jobDescription. The extra
// fallback field names below are kept defensively in case the actor's schema shifts.
interface ApifyRawJob {
  id?: string;
  jobId?: string;
  title?: string;
  position?: string;
  company?: string;
  companyName?: string;
  location?: string;
  descriptionText?: string;
  descriptionHtml?: string;
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

  let totalUpserted = 0;

  // Run each search separately (rather than batching all `urls` into one call)
  // so every result can be tagged with the `region` it came from — the batched
  // dataset doesn't reliably indicate which input URL produced which item.
  for (const search of LINKEDIN_SEARCHES) {
    let items: ApifyRawJob[];

    try {
      // `count` is the actor's actual result-limit field (not `maxResults`, which
      // it silently ignores — leaving it uncapped, which appears to pull in
      // LinkedIn's unrelated "more jobs for you" recommendations once real
      // matches run out).
      const run = await client.actor(actorId).call({ urls: [buildLinkedInUrl(search)], count: 13 });
      const dataset = await client
        .dataset(run.defaultDatasetId)
        .listItems({ limit: 200 });
      items = dataset.items as ApifyRawJob[];
    } catch (err) {
      console.error(`Apify error for search "${search.keywords}" (${search.location}):`, err);
      continue;
    }

    for (const job of items) {
      const externalId  = String(job.id ?? job.jobId ?? "");
      const title       = job.title ?? job.position ?? "";
      const company     = job.company ?? job.companyName ?? "";
      const url         = job.url ?? job.link ?? job.jobUrl ?? "";
      const description = job.descriptionText ?? job.descriptionHtml ?? job.description ?? job.jobDescription ?? null;
      const postedAtRaw = job.postedAt ?? job.publishedAt ?? job.postedDate;
      const location    = job.location ?? null;

      if (!externalId || !title || !company || !url) continue;

      const postedAt = postedAtRaw ? new Date(postedAtRaw) : null;
      const validPostedAt = postedAt && !isNaN(postedAt.getTime()) ? postedAt : null;
      const { score: relevanceScore, blocked } = scoreJob(title, description, company);

      // Blocked company or elimination-rule match — omit entirely, don't store.
      if (blocked) continue;

      const region = search.location; // e.g. "Turkey" or "Worldwide" — the search scope, not the scraped location text

      await prisma.job.upsert({
        where: { externalId },
        create:  { externalId, title, company, location, region, description, url, source: "APIFY", postedAt: validPostedAt, relevanceScore },
        update:  { title, company, location, region, description, url, postedAt: validPostedAt, relevanceScore },
      });

      totalUpserted++;
    }
  }

  return totalUpserted;
}
