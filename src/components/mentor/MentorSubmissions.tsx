"use client";
import { useEffect, useState } from "react";

type Submission = {
  id: string;
  content: string | null;
  fileUrl: string | null;
  externalLink: string | null;
  status: string;
  submittedAt: string;
  assignment: { id: string; title: string };
  trainee: { id: string; name: string; email: string };
  feedback: unknown[];
};

export function MentorSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/submissions")
      .then((r) => r.json())
      .then((data) => {
        setSubmissions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  if (loading) return <p className="text-[#6b7280]">Loading…</p>;
  const pending = submissions.filter((s) => s.status === "PENDING");
  const rest = submissions.filter((s) => s.status !== "PENDING");
  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[#171717] mb-3">
            Pending review ({pending.length})
          </h2>
          <ul className="space-y-4">
            {pending.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-[#171717]">{s.trainee.name}</p>
                    <p className="text-sm text-[#6b7280]">
                      {s.assignment.title} · {new Date(s.submittedAt).toLocaleString()}
                    </p>
                    {s.content && (
                      <p className="mt-2 text-sm text-[#374151] whitespace-pre-wrap">
                        {s.content.slice(0, 200)}
                        {s.content.length > 200 ? "…" : ""}
                      </p>
                    )}
                    {s.externalLink && (
                      <a
                        href={s.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium"
                        style={{ color: "var(--unipod-blue)" }}
                      >
                        Open link →
                      </a>
                    )}
                  </div>
                  <a
                    href={`/dashboard/mentor/submissions/${s.id}`}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-white shrink-0"
                    style={{ backgroundColor: "var(--unipod-blue)" }}
                  >
                    Review
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {rest.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[#171717] mb-3">
            Reviewed
          </h2>
          <ul className="space-y-3">
            {rest.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm flex items-center justify-between gap-4"
              >
                <span className="text-[#374151]">
                  {s.trainee.name} – {s.assignment.title} – <span className="font-medium">{s.status}</span>
                </span>
                <a
                  href={`/dashboard/mentor/submissions/${s.id}`}
                  className="text-sm font-medium shrink-0"
                  style={{ color: "var(--unipod-blue)" }}
                >
                  View →
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {submissions.length === 0 && (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 text-center shadow-sm">
          <p className="text-[#6b7280]">No submissions to review.</p>
        </div>
      )}
    </div>
  );
}
