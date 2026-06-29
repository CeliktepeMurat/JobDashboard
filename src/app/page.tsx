"use client";
import { useEffect, useState, useMemo } from "react";
import type { JobWithApplication } from "@/types";
import JobCard from "@/components/JobCard";
import JobFilters, { type SourceFilter } from "@/components/JobFilters";

export default function FeedPage() {
  const [jobs, setJobs] = useState<JobWithApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [keyword, setKeyword] = useState("");
  const [source, setSource] = useState<SourceFilter>("ALL");
  const [appliedOnly, setAppliedOnly] = useState(false);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load jobs");
        return r.json();
      })
      .then(setJobs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Client-side filtering — the full list is already cached in state
  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      if (source !== "ALL" && job.source !== source) return false;
      if (appliedOnly && !job.application) return false;
      if (keyword) {
        const q = keyword.toLowerCase();
        if (
          !job.title.toLowerCase().includes(q) &&
          !job.company.toLowerCase().includes(q) &&
          !(job.description ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [jobs, source, appliedOnly, keyword]);

  function handleApplicationChange(
    jobId: string,
    application: JobWithApplication["application"]
  ) {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, application } : j))
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Job Feed</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {loading ? "Loading…" : `${filtered.length} of ${jobs.length} jobs`}
          </p>
        </div>
        <a
          href="/tracker"
          className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          View tracker →
        </a>
      </div>

      <JobFilters
        keyword={keyword}
        source={source}
        appliedOnly={appliedOnly}
        onKeyword={setKeyword}
        onSource={setSource}
        onAppliedOnly={setAppliedOnly}
      />

      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md px-4 py-3">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-zinc-400 text-sm text-center py-16">
          Loading jobs…
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-sm">No jobs in the database yet.</p>
          <p className="text-xs mt-2">
            Trigger a fetch by calling{" "}
            <code className="bg-zinc-100 px-1 rounded">POST /api/fetch-jobs</code>{" "}
            with your <code className="bg-zinc-100 px-1 rounded">CRON_SECRET</code>.
          </p>
        </div>
      )}

      {!loading && !error && jobs.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16 text-zinc-400 text-sm">
          No jobs match your filters.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onApplicationChange={handleApplicationChange}
          />
        ))}
      </div>
    </div>
  );
}
