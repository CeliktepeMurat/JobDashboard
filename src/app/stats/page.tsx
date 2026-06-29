"use client";
import { useEffect, useState } from "react";
import type { ApplicationStatus } from "@/types";
import StatusBadge from "@/components/StatusBadge";

interface StatsData {
  total: number;
  thisWeek: number;
  thisMonth: number;
  byStatus: { status: ApplicationStatus; _count: number }[];
  byPlatform: { platform: string; _count: number }[];
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col gap-1">
      <span className="text-3xl font-bold text-slate-800">{value}</span>
      <span className="text-sm text-slate-400">{label}</span>
    </div>
  );
}

export default function StatsPage() {
  const [data, setData]       = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-slate-400 text-sm text-center py-16">Loading…</div>;
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Stats</h1>
        <p className="text-sm text-slate-400 mt-0.5">Your application activity at a glance</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total applications" value={data.total} />
        <StatCard label="This month"         value={data.thisMonth} />
        <StatCard label="This week"          value={data.thisWeek} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-700 mb-4">By Status</h2>
          {data.byStatus.length === 0 ? (
            <p className="text-sm text-slate-400">No applications yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.byStatus.map((row) => (
                <div key={row.status} className="flex items-center justify-between">
                  <StatusBadge status={row.status} />
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${Math.round((row._count / data.total) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-600 w-4 text-right">{row._count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-700 mb-4">By Platform</h2>
          {data.byPlatform.length === 0 ? (
            <p className="text-sm text-slate-400">No manual applications yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.byPlatform
                .sort((a, b) => b._count - a._count)
                .map((row) => (
                  <div key={row.platform} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{row.platform}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${Math.round((row._count / data.total) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-600 w-4 text-right">{row._count}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        "By Platform" reflects manual applications only. Feed applications (LinkedIn, Remote/Google) are counted in the totals.
      </p>
    </div>
  );
}
