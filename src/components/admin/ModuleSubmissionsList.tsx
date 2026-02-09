import Link from "next/link";

type SubmissionRow = {
  id: string;
  status: string;
  submittedAt: Date;
  assignment: { title: string };
  trainee: { name: string; email: string };
};

export function ModuleSubmissionsList({
  submissions,
}: {
  submissions: SubmissionRow[];
}) {
  if (submissions.length === 0) {
    return (
      <p className="rounded-xl border border-[#e5e7eb] bg-white p-4 text-sm text-slate-600">
        No submissions yet for this module. Trainees submit from their Learning page.
      </p>
    );
  }
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden">
      <ul className="divide-y divide-[#e5e7eb]">
        {submissions.map((s) => (
          <li key={s.id} className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-slate-800 truncate">
                {s.assignment.title} — {s.trainee.name}
              </p>
              <p className="text-xs text-slate-500">
                {s.trainee.email} · {new Date(s.submittedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  s.status === "PENDING"
                    ? "bg-amber-100 text-amber-800"
                    : s.status === "APPROVED"
                      ? "bg-green-100 text-green-800"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                {s.status}
              </span>
              <Link
                href={`/dashboard/mentor/submissions/${s.id}`}
                className="text-sm font-medium"
                style={{ color: "var(--unipod-blue)" }}
              >
                Review →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
