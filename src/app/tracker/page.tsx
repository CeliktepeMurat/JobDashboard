"use client";
import { useEffect, useState } from "react";
import type { ApplicationStatus } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import StatusSelect from "@/components/StatusSelect";
import ManualApplicationForm, { type EditableManualApplication } from "@/components/ManualApplicationForm";

// Inline "click to edit" note field, shared by feed and manual application rows.
function NotesEditor({ notes, onSave }: { notes: string | null; onSave: (notes: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState(notes ?? "");
  const [saving, setSaving]   = useState(false);

  if (!editing) {
    return (
      <button
        onClick={() => { setValue(notes ?? ""); setEditing(true); }}
        className="text-xs text-slate-400 hover:text-blue-500 mt-1 transition-colors text-left"
      >
        {notes || "+ Add note"}
      </button>
    );
  }

  return (
    <div className="mt-1 flex items-center gap-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a note…"
        className="text-xs border border-slate-200 rounded-md px-2 py-1 flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        disabled={saving}
        onClick={async () => { setSaving(true); await onSave(value); setSaving(false); setEditing(false); }}
        className="text-xs text-blue-600 hover:underline disabled:opacity-50 shrink-0"
      >
        Save
      </button>
      <button onClick={() => setEditing(false)} className="text-xs text-slate-400 hover:underline shrink-0">
        Cancel
      </button>
    </div>
  );
}

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
  const [editingApp, setEditingApp] = useState<EditableManualApplication | null>(null);
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

  async function updateFeedNotes(id: string, notes: string) {
    const res = await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, notes }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setFeedApps((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
  }

  async function updateManualNotes(id: string, notes: string) {
    const res = await fetch("/api/manual-applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, notes }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setManualApps((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
  }

  async function deleteManual(id: string) {
    if (!confirm("Delete this manual application? This can't be undone.")) return;
    const res = await fetch(`/api/manual-applications?id=${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setManualApps((prev) => prev.filter((a) => a.id !== id));
  }

  function handleManualSaved(entry: unknown) {
    const saved = entry as ManualApplication;
    setManualApps((prev) =>
      prev.some((a) => a.id === saved.id)
        ? prev.map((a) => (a.id === saved.id ? saved : a))
        : [saved, ...prev]
    );
    setShowForm(false);
    setEditingApp(null);
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
          onClick={() => { setEditingApp(null); setShowForm((v) => !v); }}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          + Add Manual Job
        </button>
      </div>

      {(showForm || editingApp) && (
        <ManualApplicationForm
          editing={editingApp}
          onSaved={handleManualSaved}
          onCancel={() => { setShowForm(false); setEditingApp(null); }}
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
                <NotesEditor notes={app.notes} onSave={(n) => updateFeedNotes(app.id, n)} />
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
                <NotesEditor notes={app.notes} onSave={(n) => updateManualNotes(app.id, n)} />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={app.status} />
                <StatusSelect
                  value={app.status}
                  onChange={(s) => updateManualStatus(app.id, s)}
                  disabled={updatingId === app.id}
                />
                <button
                  onClick={() => { setShowForm(false); setEditingApp(app); }}
                  className="text-xs text-slate-400 hover:text-blue-500 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteManual(app.id)}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
