"use client";
import type { ApplicationStatus } from "@/types";

const OPTIONS: ApplicationStatus[] = [
  "APPLIED",
  "FOLLOWED_UP",
  "INTERVIEWING",
  "REJECTED",
  "OFFER",
];

const labels: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  FOLLOWED_UP: "Followed Up",
  INTERVIEWING: "Interviewing",
  REJECTED: "Rejected",
  OFFER: "Offer",
};

interface Props {
  value: ApplicationStatus;
  onChange: (status: ApplicationStatus) => void;
  disabled?: boolean;
}

export default function StatusSelect({ value, onChange, disabled }: Props) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as ApplicationStatus)}
      className="text-sm border border-zinc-200 rounded px-2 py-1 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50"
    >
      {OPTIONS.map((s) => (
        <option key={s} value={s}>
          {labels[s]}
        </option>
      ))}
    </select>
  );
}
