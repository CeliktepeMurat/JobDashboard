"use client";
import { useEffect, useState, useMemo } from "react";
import type { JobWithApplication } from "@/types";
import { relevanceLabel } from "@/lib/scoring";
import JobCard from "@/components/JobCard";
import JobFilters, { type SourceFilter, type RelevanceFilter, type SortOrder } from "@/components/JobFilters";

export default function FeedPage() {
  const [jobs, setJobs]         = useState<JobWithApplication[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<string | null>(null);

  const [keyword,     setKeyword]     = useState("");
  const [source,      setSource]      = useState<SourceFilter>("ALL");
  const [region,      setRegion]      = useState("ALL");
  const [appliedOnly, setAppliedOnly] = useState(false);
  const [relevance,   setRelevance]   = useState<RelevanceFilter>("MEDIUM_PLUS");
  const [sort,        setSort]        = useState<SortOrder>("newest");

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
      const res  = await fetch("/api/fetch-jobs", { method: "POST" });
      const data = await res.json();
      const counts = Object.entries(data.results ?? {})
        .map(([label, count]) => `${count} ${label}`)
        .join(", ");
      if (data.errors?.length) {
        setFetchResult(`Fetched ${counts}. Errors: ${data.errors.join(", ")}`);
      } else {
        setFetchResult(`Fetched ${counts} jobs.`);
      }
      loadJobs();
    } catch {
      setFetchResult("Fetch failed — check the console.");
    } finally {
      setFetching(false);
    }
  }

  const lastFetched = useMemo(() => {
    if (jobs.length === 0) return null;
    const latest = Math.max(...jobs.map((j) => new Date(j.fetchedAt).getTime()));
    return new Date(latest);
  }, [jobs]);

  const regionOptions = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.region).filter((r): r is string => !!r))).sort(),
    [jobs]
  );

  const filtered = useMemo(() => {
    let list = jobs.filter((job) => {
      if (source !== "ALL" && job.source !== source) return false;
      if (region !== "ALL" && job.region !== region) return false;
      if (appliedOnly && !job.application) return false;
      if (relevance === "HIGH"         && relevanceLabel(job.relevanceScore) !== "High")   return false;
      if (relevance === "MEDIUM_PLUS"  && relevanceLabel(job.relevanceScore) === "Low")    return false;
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

    if (sort === "relevance") {
      list = [...list].sort((a, b) => b.relevanceScore - a.relevanceScore);
    } else if (sort === "newest") {
      // Sort by postedAt (actual listing date), not fetchedAt — jobs pulled in
      // the same fetch run all get nearly-identical fetchedAt timestamps, so
      // that ordering carries no real "newest" signal. postedAt is date-only
      // (no time-of-day), so fetchedAt is used as a tiebreaker within a day.
      list = [...list].sort((a, b) => {
        const aPosted = a.postedAt ? new Date(a.postedAt).getTime() : 0;
        const bPosted = b.postedAt ? new Date(b.postedAt).getTime() : 0;
        if (bPosted !== aPosted) return bPosted - aPosted;
        return new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime();
      });
    }

    return list;
  }, [jobs, source, region, appliedOnly, relevance, sort, keyword]);

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
            {lastFetched && (
              <span className="text-slate-300">
                {" · "}Last fetched {lastFetched.toLocaleString("en-GB", {
                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                })}
              </span>
            )}
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
          {fetchResult && <p className="text-xs text-slate-500">{fetchResult}</p>}
        </div>
      </div>

      <JobFilters
        keyword={keyword}
        source={source}
        region={region}
        regionOptions={regionOptions}
        appliedOnly={appliedOnly}
        relevance={relevance}
        sort={sort}
        onKeyword={setKeyword}
        onSource={setSource}
        onRegion={setRegion}
        onAppliedOnly={setAppliedOnly}
        onRelevance={setRelevance}
        onSort={setSort}
      />

      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {loading && <div className="text-slate-400 text-sm text-center py-16">Loading jobs…</div>}

      {!loading && !error && jobs.length === 0 && (
        <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/50">
          <p className="text-sm font-medium text-slate-500">No jobs yet.</p>
          <p className="text-xs mt-2">
            Click <span className="font-semibold text-slate-500">Fetch Jobs</span> to pull listings from LinkedIn.
          </p>
        </div>
      )}

      {!loading && !error && jobs.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl bg-white/50">
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
