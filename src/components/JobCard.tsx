"use client";
import { useState } from "react";
import type { JobWithApplication, ApplicationStatus } from "@/types";
import StatusBadge from "./StatusBadge";
import StatusSelect from "./StatusSelect";

interface Props {
  job: JobWithApplication;
  onApplicationChange: (jobId: string, application: JobWithApplication["application"]) => void;
}

const sourceLabel: Record<string, string> = {
  SERPAPI: "Remote (Google)",
  APIFY: "LinkedIn",
};

const sourceBadge: Record<string, string> = {
  SERPAPI: "bg-orange-100 text-orange-700",
  APIFY: "bg-sky-100 text-sky-700",
};

export default function JobCard({ job, onApplicationChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function markApplied() {
    setLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      if (!res.ok) throw new Error("Failed to mark as applied");
      const application = await res.json();
      onApplicationChange(job.id, application);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(status: ApplicationStatus) {
    if (!job.application) return;
    setLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: job.application.id, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const application = await res.json();
      onApplicationChange(job.id, application);
    } finally {
      setLoading(false);
    }
  }

  const postedLabel = job.postedAt
    ? new Date(job.postedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-col gap-3 hover:border-zinc-300 transition-colors">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-zinc-900 hover:text-blue-600 transition-colors line-clamp-1"
          >
            {job.title}
          </a>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-sm text-zinc-500">
            <span>{job.company}</span>
            {job.location && (
              <>
                <span>·</span>
                <span>{job.location}</span>
              </>
            )}
            {postedLabel && (
              <>
                <span>·</span>
                <span>{postedLabel}</span>
              </>
            )}
          </div>
        </div>

        {/* Source badge */}
        <span
          className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded ${sourceBadge[job.source] ?? "bg-zinc-100 text-zinc-600"}`}
        >
          {sourceLabel[job.source] ?? job.source}
        </span>
      </div>

      {/* Description */}
      {job.description && (
        <div>
          <p className={`text-sm text-zinc-600 leading-relaxed ${expanded ? "" : "line-clamp-3"}`}>
            {job.description}
          </p>
          {job.description.length > 200 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-zinc-400 hover:text-zinc-600 mt-1"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-zinc-100">
        {job.application ? (
          <div className="flex items-center gap-2">
            <StatusBadge status={job.application.status as ApplicationStatus} />
            <StatusSelect
              value={job.application.status as ApplicationStatus}
              onChange={updateStatus}
              disabled={loading}
            />
          </div>
        ) : (
          <button
            onClick={markApplied}
            disabled={loading}
            className="text-sm font-medium px-3 py-1.5 rounded bg-zinc-900 text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving…" : "Mark as Applied"}
          </button>
        )}

        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          View job →
        </a>
      </div>
    </div>
  );
}
