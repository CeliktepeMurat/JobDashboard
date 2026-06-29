"use client";
import { useState } from "react";
import type { ApplicationStatus } from "@/types";

interface FormData {
  company: string;
  role: string;
  platform: string;
  url: string;
  status: ApplicationStatus;
  appliedAt: string;
  notes: string;
}

const PLATFORMS = [
  "Indeed",
  "Wellfound",
  "Kariyer.net",
  "Company Site",
  "RemoteYeah",
  "Other",
];

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "APPLIED", label: "Applied" },
  { value: "FOLLOWED_UP", label: "Followed Up" },
  { value: "INTERVIEWING", label: "Interviewing" },
  { value: "REJECTED", label: "Rejected" },
  { value: "OFFER", label: "Offer" },
];

interface Props {
  onCreated: (entry: unknown) => void;
  onCancel: () => void;
}

export default function ManualApplicationForm({ onCreated, onCancel }: Props) {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState<FormData>({
    company: "",
    role: "",
    platform: "Indeed",
    url: "",
    status: "APPLIED",
    appliedAt: today,
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company || !form.role || !form.platform) {
      setError("Company, role, and platform are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/manual-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          url: form.url || undefined,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to save");
      }
      onCreated(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-zinc-200 rounded-lg p-5 flex flex-col gap-4"
    >
      <h3 className="font-semibold text-zinc-900">Add Manual Application</h3>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Company *</label>
          <input
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
            placeholder="Acme Corp"
            className="border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Role *</label>
          <input
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
            placeholder="Software Engineer"
            className="border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Platform *</label>
          <select
            value={form.platform}
            onChange={(e) => set("platform", e.target.value)}
            className="border border-zinc-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Status</label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            className="border border-zinc-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Date Applied</label>
          <input
            type="date"
            value={form.appliedAt}
            onChange={(e) => set("appliedAt", e.target.value)}
            className="border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Link (optional)</label>
          <input
            type="url"
            value={form.url}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://..."
            className="border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500">Notes (optional)</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Referral from X, interesting tech stack, salary range…"
          rows={2}
          className="border border-zinc-200 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>

      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm px-3 py-1.5 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="text-sm px-4 py-1.5 rounded bg-zinc-900 text-white font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
