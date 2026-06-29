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

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-5 flex flex-col gap-1">
      <span className="text-3xl font-bold text-zinc-900">{value}</span>
      <span className="text-sm text-zinc-500">{label}</span>
    </div>
  );
}

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-zinc-400 text-sm text-center py-16">Loading…</div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Stats</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Your application activity at a glance</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total applications" value={data.total} />
        <StatCard label="This month" value={data.thisMonth} />
        <StatCard label="This week" value={data.thisWeek} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <h2 className="font-semibold text-zinc-900 mb-4">By Status</h2>
          {data.byStatus.length === 0 ? (
            <p className="text-sm text-zinc-400">No applications yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.byStatus.map((row) => (
                <div key={row.status} className="flex items-center justify-between">
                  <StatusBadge status={row.status} />
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-zinc-100 rounded-full h-1.5">
                      <div
                        className="bg-zinc-700 h-1.5 rounded-full"
                        style={{
                          width: `${Math.round((row._count / data.total) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-zinc-700 w-4 text-right">
                      {row._count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform breakdown */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <h2 className="font-semibold text-zinc-900 mb-4">By Platform</h2>
          {data.byPlatform.length === 0 ? (
            <p className="text-sm text-zinc-400">No manual applications yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.byPlatform
                .sort((a, b) => b._count - a._count)
                .map((row) => (
                  <div key={row.platform} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-700">{row.platform}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-zinc-100 rounded-full h-1.5">
                        <div
                          className="bg-zinc-700 h-1.5 rounded-full"
                          style={{
                            width: `${Math.round((row._count / data.total) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-zinc-700 w-4 text-right">
                        {row._count}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-zinc-400">
        Note: "By Platform" reflects manual applications only. Feed applications (LinkedIn, Remote/Google) are counted in the totals.
      </p>
    </div>
  );
}
