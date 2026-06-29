// Fetches LinkedIn job listings via an Apify actor.
//
// Why Apify for LinkedIn?
// LinkedIn doesn't offer a public jobs API, so a scraper actor on Apify is
// the practical way to get LinkedIn listings programmatically. Apify runs
// the scraper in the cloud and returns structured data — we just trigger
// the actor and wait for the dataset.
//
// Which actor?
// Set APIFY_ACTOR_ID in .env to your chosen LinkedIn scraper actor ID,
// e.g. "curious_coder/linkedin-jobs-scraper". The actor's input schema
// varies, so we send a general-purpose input that works with most LinkedIn
// scraper actors on Apify.
//
// This module is server-side only — APIFY_TOKEN must never reach the browser.

import { ApifyClient } from "apify-client";
import { prisma } from "@/lib/prisma";

// Search configurations for LinkedIn.
// Covers both Turkey-based and global remote roles.
const LINKEDIN_SEARCHES = [
  { keywords: "software engineer", location: "Turkey" },
  { keywords: "full stack developer", location: "Turkey" },
  { keywords: "blockchain developer", location: "Worldwide" },
  { keywords: "remote software engineer", location: "Worldwide" },
];

// Apify actors return different field names depending on the actor.
// This interface covers the most common LinkedIn scraper shapes.
interface ApifyRawJob {
  // curious_coder/linkedin-jobs-scraper shape
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
  const token = process.env.APIFY_TOKEN;
  const actorId = process.env.APIFY_ACTOR_ID;

  if (!token) throw new Error("APIFY_TOKEN is not set");
  if (!actorId) throw new Error("APIFY_ACTOR_ID is not set");

  const client = new ApifyClient({ token });
  let totalUpserted = 0;

  for (const search of LINKEDIN_SEARCHES) {
    let items: ApifyRawJob[];

    try {
      // .call() runs the actor and waits for it to finish.
      // The input object is the standard LinkedIn scraper input shape.
      const run = await client.actor(actorId).call({
        keywords: search.keywords,
        location: search.location,
        maxResults: 25,
        // Some actors use these alternative field names:
        searchKeywords: search.keywords,
        searchLocation: search.location,
      });

      const dataset = await client
        .dataset(run.defaultDatasetId)
        .listItems({ limit: 25 });

      items = dataset.items as ApifyRawJob[];
    } catch (err) {
      console.error(
        `Apify error for "${search.keywords}" in "${search.location}":`,
        err
      );
      continue;
    }

    for (const job of items) {
      // Normalize across different actor field name conventions
      const externalId = String(job.id ?? job.jobId ?? "");
      const title = job.title ?? job.position ?? "";
      const company = job.company ?? job.companyName ?? "";
      const url = job.url ?? job.link ?? job.jobUrl ?? "";
      const description = job.description ?? job.jobDescription ?? null;
      const postedAtRaw = job.postedAt ?? job.publishedAt ?? job.postedDate;
      const location = job.location ?? null;

      // Skip records missing the minimum required fields
      if (!externalId || !title || !company || !url) continue;

      const postedAt = postedAtRaw ? new Date(postedAtRaw) : null;
      // If the date parse failed (NaN), treat as null
      const validPostedAt =
        postedAt && !isNaN(postedAt.getTime()) ? postedAt : null;

      await prisma.job.upsert({
        where: { externalId },
        create: {
          externalId,
          title,
          company,
          location,
          description,
          url,
          source: "APIFY",
          postedAt: validPostedAt,
        },
        update: {
          title,
          company,
          location,
          description,
          url,
          postedAt: validPostedAt,
        },
      });

      totalUpserted++;
    }
  }

  return totalUpserted;
}
