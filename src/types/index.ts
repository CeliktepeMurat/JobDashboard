// Shared TypeScript types used across the app

export type JobSource = "SERPAPI" | "APIFY";

export type ApplicationStatus =
  | "APPLIED"
  | "FOLLOWED_UP"
  | "INTERVIEWING"
  | "REJECTED"
  | "OFFER";

// Shape of a job as returned to the frontend
export interface JobWithApplication {
  id: string;
  externalId: string;
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  url: string;
  source: JobSource;
  postedAt: string | null;
  fetchedAt: string;
  application: {
    id: string;
    status: ApplicationStatus;
    appliedAt: string;
    notes: string | null;
  } | null;
}

// Shape returned from the SerpApi Google Jobs endpoint
export interface SerpApiJobResult {
  job_id: string;
  title: string;
  company_name: string;
  location: string;
  description: string;
  job_highlights?: { title: string; items: string[] }[];
  related_links?: { link: string; text: string }[];
  detected_extensions?: {
    posted_at?: string;
    schedule_type?: string;
    work_from_home?: boolean;
  };
  apply_options?: { title: string; link: string }[];
}

// Shape returned from the Apify LinkedIn scraper
export interface ApifyJobResult {
  id: string;
  title: string;
  companyName: string;
  location: string;
  description: string;
  url: string;
  publishedAt: string;
}

// Filters for the job feed
export interface JobFilters {
  keyword?: string;
  source?: JobSource | "ALL";
  appliedOnly?: boolean;
}
