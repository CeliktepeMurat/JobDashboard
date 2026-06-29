import type { ApplicationStatus } from "@/types";

const styles: Record<ApplicationStatus, string> = {
  APPLIED:      "bg-blue-50 text-blue-600 ring-1 ring-blue-200",
  FOLLOWED_UP:  "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
  INTERVIEWING: "bg-violet-50 text-violet-600 ring-1 ring-violet-200",
  REJECTED:     "bg-red-50 text-red-500 ring-1 ring-red-200",
  OFFER:        "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200",
};

const labels: Record<ApplicationStatus, string> = {
  APPLIED:      "Applied",
  FOLLOWED_UP:  "Followed Up",
  INTERVIEWING: "Interviewing",
  REJECTED:     "Rejected",
  OFFER:        "Offer",
};

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
