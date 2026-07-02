"use client";

export type SourceFilter    = "ALL" | "SERPAPI" | "APIFY";
export type RelevanceFilter = "ALL" | "HIGH" | "MEDIUM_PLUS";
export type SortOrder       = "newest" | "relevance";

interface Props {
  keyword: string;
  source: SourceFilter;
  region: string;
  regionOptions: string[];
  appliedOnly: boolean;
  relevance: RelevanceFilter;
  sort: SortOrder;
  onKeyword:     (v: string) => void;
  onSource:      (v: SourceFilter) => void;
  onRegion:      (v: string) => void;
  onAppliedOnly: (v: boolean) => void;
  onRelevance:   (v: RelevanceFilter) => void;
  onSort:        (v: SortOrder) => void;
}

const sourceOptions: { value: SourceFilter; label: string }[] = [
  { value: "ALL",     label: "All sources" },
  { value: "SERPAPI", label: "Remote (Google)" },
  { value: "APIFY",   label: "LinkedIn" },
];

const relevanceOptions: { value: RelevanceFilter; label: string }[] = [
  { value: "ALL",         label: "All matches" },
  { value: "MEDIUM_PLUS", label: "Medium+ match" },
  { value: "HIGH",        label: "High match only" },
];

const sortOptions: { value: SortOrder; label: string }[] = [
  { value: "newest",    label: "Newest first" },
  { value: "relevance", label: "Best match first" },
];

const selectClass =
  "border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer";

export default function JobFilters({
  keyword, source, region, regionOptions, appliedOnly, relevance, sort,
  onKeyword, onSource, onRegion, onAppliedOnly, onRelevance, onSort,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <input
        type="search"
        placeholder="Search title, company, description…"
        value={keyword}
        onChange={(e) => onKeyword(e.target.value)}
        className="flex-1 min-w-48 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <select value={source} onChange={(e) => onSource(e.target.value as SourceFilter)} className={selectClass}>
        {sourceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {regionOptions.length > 0 && (
        <select value={region} onChange={(e) => onRegion(e.target.value)} className={selectClass}>
          <option value="ALL">All locations</option>
          {regionOptions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      )}

      <select value={relevance} onChange={(e) => onRelevance(e.target.value as RelevanceFilter)} className={selectClass}>
        {relevanceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <select value={sort} onChange={(e) => onSort(e.target.value as SortOrder)} className={selectClass}>
        {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={appliedOnly}
          onChange={(e) => onAppliedOnly(e.target.checked)}
          className="rounded border-slate-300 accent-blue-600"
        />
        Applied only
      </label>
    </div>
  );
}
