"use client";
import { useEffect, useState } from "react";
import type { ApplicationStatus } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import StatusSelect from "@/components/StatusSelect";
import ManualApplicationForm from "@/components/ManualApplicationForm";

interface FeedApplication {
  id: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  notes: string | null;
  job: {
    id: string;
    title: string;
    company: string;
    location: string | null;
    url: string;
    source: string;
  };
}

interface ManualApplication {
  id: string;
  company: string;
  role: string;
  platform: string;
  url: string | null;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  notes: string | null;
}

export default function TrackerPage() {
  const [feedApps,   setFeedApps]   = useState<FeedApplication[]>([]);
  const [manualApps, setManualApps] = useState<ManualApplication[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [appsRes, manualRes] = await Promise.all([
        fetch("/api/applications"),
        fetch("/api/manual-applications"),
      ]);
      const [apps, manuals] = await Promise.all([appsRes.json(), manualRes.json()]);
      setFeedApps(Array.isArray(apps) ? apps : []);
      setManualApps(Array.isArray(manuals) ? manuals : []);
      setLoading(false);
    }
    load();
  }, []);

  async function updateFeedStatus(id: string, status: ApplicationStatus) {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setFeedApps((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
    } finally {
      setUpdatingId(null);
    }
  }

  async function updateManualStatus(id: string, status: ApplicationStatus) {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/manual-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setManualApps((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
    } finally {
      setUpdatingId(null);
    }
  }

  function handleManualCreated(entry: unknown) {
    setManualApps((prev) => [entry as ManualApplication, ...prev]);
    setShowForm(false);
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const sourceLabel: Record<string, string> = { SERPAPI: "Remote", APIFY: "LinkedIn" };

  const rowClass = "bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex items-start justify-between gap-4 hover:shadow-md transition-all";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Tracker</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {loading ? "Loading…" : `${feedApps.length + manualApps.length} total applications`}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          + Add Manual Job
        </button>
      </div>

      {showForm && (
        <ManualApplicationForm
          onCreated={handleManualCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Feed applications */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          From Feed ({feedApps.length})
        </h2>
        {loading && <p className="text-sm text-slate-400">Loading…</p>}
        {!loading && feedApps.length === 0 && (
          <p className="text-sm text-slate-400">
            No feed applications yet. Mark jobs as applied from the{" "}
            <a href="/" className="text-blue-500 hover:underline">Feed</a>.
          </p>
        )}
        <div className="flex flex-col gap-2">
          {feedApps.map((app) => (
            <div key={app.id} className={rowClass}>
              <div className="flex-1 min-w-0">
                <a
                  href={app.job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-slate-800 hover:text-blue-600 transition-colors"
                >
                  {app.job.title}
                </a>
                <div className="flex items-center gap-2 flex-wrap text-sm text-slate-500 mt-0.5">
                  <span>{app.job.company}</span>
                  {app.job.location && <><span>·</span><span>{app.job.location}</span></>}
                  <span>·</span>
                  <span>{sourceLabel[app.job.source] ?? app.job.source}</span>
                  <span>·</span>
                  <span>Applied {fmt(app.appliedAt)}</span>
                </div>
                {app.notes && <p className="text-xs text-slate-400 mt-1">{app.notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={app.status} />
                <StatusSelect
                  value={app.status}
                  onChange={(s) => updateFeedStatus(app.id, s)}
                  disabled={updatingId === app.id}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Manual applications */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Manual Applications ({manualApps.length})
        </h2>
        {!loading && manualApps.length === 0 && (
          <p className="text-sm text-slate-400">
            No manual applications yet. Use "+ Add Manual Job" above.
          </p>
        )}
        <div className="flex flex-col gap-2">
          {manualApps.map((app) => (
            <div key={app.id} className={rowClass}>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800">
                  {app.role}{" "}
                  <span className="font-normal text-slate-500">@ {app.company}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-sm text-slate-500 mt-0.5">
                  <span>{app.platform}</span>
                  <span>·</span>
                  <span>Applied {fmt(app.appliedAt)}</span>
                  {app.url && (
                    <><span>·</span>
                    <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      View posting
                    </a></>
                  )}
                </div>
                {app.notes && <p className="text-xs text-slate-400 mt-1">{app.notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={app.status} />
                <StatusSelect
                  value={app.status}
                  onChange={(s) => updateManualStatus(app.id, s)}
                  disabled={updatingId === app.id}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
