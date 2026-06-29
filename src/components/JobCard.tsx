"use client";
import { useState } from "react";
import type { JobWithApplication, ApplicationStatus } from "@/types";
import { relevanceLabel } from "@/lib/scoring";
import StatusBadge from "./StatusBadge";
import StatusSelect from "./StatusSelect";

interface Props {
  job: JobWithApplication;
  onApplicationChange: (jobId: string, application: JobWithApplication["application"]) => void;
}

const sourceLabel: Record<string, string> = { SERPAPI: "Remote", APIFY: "LinkedIn" };

const sourceBadge: Record<string, string> = {
  SERPAPI: "bg-orange-50 text-orange-600 ring-1 ring-orange-200",
  APIFY:   "bg-sky-50 text-sky-600 ring-1 ring-sky-200",
};

const relevanceBadge: Record<string, string> = {
  High:   "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200",
  Medium: "bg-blue-50 text-blue-500 ring-1 ring-blue-200",
  Low:    "bg-slate-50 text-slate-400 ring-1 ring-slate-200",
};

export default function JobCard({ job, onApplicationChange }: Props) {
  const [loading, setLoading]   = useState(false);
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
      onApplicationChange(job.id, await res.json());
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
      onApplicationChange(job.id, await res.json());
    } finally {
      setLoading(false);
    }
  }

  const postedLabel = job.postedAt
    ? new Date(job.postedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const relLabel = relevanceLabel(job.relevanceScore);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3 hover:shadow-md hover:border-slate-200 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-slate-800 hover:text-blue-600 transition-colors line-clamp-1"
          >
            {job.title}
          </a>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-sm text-slate-500">
            <span className="font-medium text-slate-600">{job.company}</span>
            {job.location && <><span>·</span><span>{job.location}</span></>}
            {postedLabel && <><span>·</span><span>{postedLabel}</span></>}
          </div>
        </div>
        {/* Source + Relevance badges */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${relevanceBadge[relLabel]}`}>
            {relLabel} match
          </span>
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${sourceBadge[job.source] ?? "bg-slate-100 text-slate-600"}`}>
            {sourceLabel[job.source] ?? job.source}
          </span>
        </div>
      </div>

      {/* Description */}
      {job.description && (
        <div>
          <p className={`text-sm text-slate-500 leading-relaxed ${expanded ? "" : "line-clamp-3"}`}>
            {job.description}
          </p>
          {job.description.length > 200 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-slate-400 hover:text-blue-500 mt-1 transition-colors"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
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
            className="text-sm font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving…" : "Mark as Applied"}
          </button>
        )}
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-slate-400 hover:text-blue-500 transition-colors"
        >
          View job →
        </a>
      </div>
    </div>
  );
}
