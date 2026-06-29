"use client";
import { useEffect, useState, useMemo } from "react";
import type { JobWithApplication } from "@/types";
import JobCard from "@/components/JobCard";
import JobFilters, { type SourceFilter } from "@/components/JobFilters";

export default function FeedPage() {
  const [jobs, setJobs]       = useState<JobWithApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<string | null>(null);

  const [keyword,     setKeyword]     = useState("");
  const [source,      setSource]      = useState<SourceFilter>("ALL");
  const [appliedOnly, setAppliedOnly] = useState(false);

  function loadJobs() {
    setLoading(true);
    fetch("/api/jobs")
      .then((r) => { if (!r.ok) throw new Error("Failed to load jobs"); return r.json(); })
      .then(setJobs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadJobs(); }, []);

  async function triggerFetch() {
    setFetching(true);
    setFetchResult(null);
    try {
      const res = await fetch("/api/fetch-jobs", { method: "POST" });
      const data = await res.json();
      if (data.errors?.length) {
        setFetchResult(`Done with errors: ${data.errors.join(", ")}`);
      } else {
        setFetchResult(`Fetched ${data.serpapi} remote + ${data.apify} LinkedIn jobs.`);
      }
      loadJobs();
    } catch {
      setFetchResult("Fetch failed — check the console.");
    } finally {
      setFetching(false);
    }
  }

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
        ) return false;
      }
      return true;
    });
  }, [jobs, source, appliedOnly, keyword]);

  function handleApplicationChange(jobId: string, application: JobWithApplication["application"]) {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, application } : j)));
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Job Feed</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {loading ? "Loading…" : `${filtered.length} of ${jobs.length} jobs`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={triggerFetch}
            disabled={fetching}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {fetching ? "Fetching…" : "Fetch Jobs"}
          </button>
          {fetchResult && (
            <p className="text-xs text-slate-500">{fetchResult}</p>
          )}
        </div>
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
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-slate-400 text-sm text-center py-16">Loading jobs…</div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm font-medium">No jobs yet.</p>
          <p className="text-xs mt-2">Click <span className="font-semibold text-slate-500">Fetch Jobs</span> to pull listings from SerpApi and LinkedIn.</p>
        </div>
      )}

      {!loading && !error && jobs.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">
          No jobs match your filters.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((job) => (
          <JobCard key={job.id} job={job} onApplicationChange={handleApplicationChange} />
        ))}
      </div>
    </div>
  );
}
