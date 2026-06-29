"use client";

export type SourceFilter = "ALL" | "SERPAPI" | "APIFY";

interface Props {
  keyword: string;
  source: SourceFilter;
  appliedOnly: boolean;
  onKeyword: (v: string) => void;
  onSource: (v: SourceFilter) => void;
  onAppliedOnly: (v: boolean) => void;
}

const sourceOptions: { value: SourceFilter; label: string }[] = [
  { value: "ALL", label: "All sources" },
  { value: "SERPAPI", label: "Remote (Google)" },
  { value: "APIFY", label: "LinkedIn" },
];

export default function JobFilters({
  keyword,
  source,
  appliedOnly,
  onKeyword,
  onSource,
  onAppliedOnly,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <input
        type="search"
        placeholder="Search title, company, description…"
        value={keyword}
        onChange={(e) => onKeyword(e.target.value)}
        className="flex-1 min-w-48 border border-zinc-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
      />

      <select
        value={source}
        onChange={(e) => onSource(e.target.value as SourceFilter)}
        className="border border-zinc-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
      >
        {sourceOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={appliedOnly}
          onChange={(e) => onAppliedOnly(e.target.checked)}
          className="rounded border-zinc-300"
        />
        Applied only
      </label>
    </div>
  );
}
