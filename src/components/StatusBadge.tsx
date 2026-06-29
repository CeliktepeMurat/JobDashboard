import type { ApplicationStatus } from "@/types";

const styles: Record<ApplicationStatus, string> = {
  APPLIED: "bg-blue-100 text-blue-700",
  FOLLOWED_UP: "bg-yellow-100 text-yellow-700",
  INTERVIEWING: "bg-purple-100 text-purple-700",
  REJECTED: "bg-red-100 text-red-600",
  OFFER: "bg-green-100 text-green-700",
};

const labels: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  FOLLOWED_UP: "Followed Up",
  INTERVIEWING: "Interviewing",
  REJECTED: "Rejected",
  OFFER: "Offer",
};

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
