"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

const GRADES = ["A+", "A", "B+", "B", "C", "D"] as const;

type TraineeItem = {
  id: string;
  trainee: { id: string; name: string | null; email: string | null };
};

type SubmissionDetail = {
  id: string;
  content: string | null;
  fileUrl: string | null;
  externalLink: string | null;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  assignment: { id: string; title: string; module?: { title: string } };
  trainee: { id: string; name: string | null; email: string | null };
  feedback: {
    id: string;
    comment: string | null;
    grade: string | null;
    adminComment: string | null;
    adminApprovedAt: string | null;
    mentor?: { name: string | null };
  }[];
};

export function AssignmentGradingView({
  submissions,
  assignmentTitle,
  mode,
  backHref,
}: {
  submissions: TraineeItem[];
  assignmentTitle: string;
  mode: "mentor" | "admin";
  backHref: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(submissions[0]?.id ?? null);
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [grade, setGrade] = useState<string>("");
  const [note, setNote] = useState("");
  const [adminComment, setAdminComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return submissions;
    const q = search.toLowerCase();
    return submissions.filter(
      (s) =>
        s.trainee.name?.toLowerCase().includes(q) ||
        s.trainee.email?.toLowerCase().includes(q)
    );
  }, [submissions, search]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    fetch(`/api/submissions/${selectedId}`)
      .then((r) => r.json())
      .then((data) => {
        setDetail(data?.id ? data : null);
        const latest = data?.feedback?.[data.feedback.length - 1];
        setGrade(latest?.grade ?? "");
        setNote(latest?.comment ?? "");
        setAdminComment(latest?.adminComment ?? "");
      })
      .catch(() => setDetail(null))
      .finally(() => setLoadingDetail(false));
  }, [selectedId]);

  useEffect(() => {
    if (submissions.length > 0 && !selectedId) setSelectedId(submissions[0].id);
  }, [submissions, selectedId]);

  async function handleAccept() {
    if (!detail) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: detail.id,
          comment: note || undefined,
          grade: grade || undefined,
          status: "APPROVED",
          ...(mode === "admin" && { adminComment: adminComment || undefined }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed");
        setSubmitting(false);
        return;
      }
      router.refresh();
      setDetail(null);
      setSelectedId(null);
    } catch {
      setError("Network error");
    }
    setSubmitting(false);
  }

  async function handleResubmission() {
    if (!detail) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: detail.id,
          comment: note || undefined,
          grade: grade || undefined,
          status: "RESUBMIT_REQUESTED",
          ...(mode === "admin" && { adminComment: adminComment ?? "" }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed");
        setSubmitting(false);
        return;
      }
      router.refresh();
      setDetail(null);
      setSelectedId(null);
    } catch {
      setError("Network error");
    }
    setSubmitting(false);
  }

  const canGradeMentor = mode === "mentor" && detail?.status === "PENDING";
  const canGradeAdmin = mode === "admin" && detail?.status === "PENDING_ADMIN_APPROVAL";
  const showGradeForm = canGradeMentor || canGradeAdmin;

  const fileDisplayName = detail?.fileUrl
    ? detail.fileUrl.split("/").pop() ?? "Submitted file"
    : detail?.externalLink
      ? "External link"
      : null;

  return (
    <div className="flex flex-1 min-h-0 h-full rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] overflow-hidden">
      {/* Left: trainee list */}
      <aside className="w-72 flex-shrink-0 flex flex-col border-r border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937]">
        <div className="relative p-3 border-b border-[#e5e7eb] dark:border-[#374151]">
          <span className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-[#9ca3af]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827] px-3 py-2.5 pl-9 pr-3 text-sm text-[#171717] dark:text-[#f9fafb] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
            aria-label="Search trainees"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedId(s.id)}
              className={`w-full text-left px-4 py-3 border-b border-[#f3f4f6] dark:border-[#374151] transition-colors ${
                selectedId === s.id
                  ? "bg-[#f3f4f6] dark:bg-[#374151] font-semibold text-[#171717] dark:text-[#f9fafb]"
                  : "hover:bg-[#f9fafb] dark:hover:bg-[#111827] text-[#374151] dark:text-[#d1d5db]"
              }`}
            >
              {s.trainee.name || s.trainee.email || "Trainee"}
            </button>
          ))}
        </div>
      </aside>

      {/* Right: submission detail */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-[#f5f5f7] dark:bg-[#111827] p-6">
        {loadingDetail && (
          <p className="text-[#6b7280] dark:text-[#9ca3af]">Loading…</p>
        )}
        {!loadingDetail && detail && (
          <div className="max-w-2xl space-y-6">
            <h1 className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">
              {detail.trainee.name || detail.trainee.email || "Trainee"}
            </h1>

            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9ca3af]">
                Status
              </p>
              <p
                className={`mt-1 text-base font-medium ${
                  detail.status === "PENDING" || detail.status === "PENDING_ADMIN_APPROVAL"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-[#374151] dark:text-[#d1d5db]"
                }`}
              >
                {detail.status === "PENDING_ADMIN_APPROVAL" ? "Submitted (pending admin confirmation)" : detail.status.replace(/_/g, " ")}
              </p>
              <p className="mt-0.5 text-sm text-[#6b7280] dark:text-[#9ca3af]">
                On {new Date(detail.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </section>

            {(detail.fileUrl || detail.externalLink) && (
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9ca3af]">
                  File
                </p>
                <p className="mt-1 text-sm font-medium text-[#171717] dark:text-[#f9fafb]">
                  {fileDisplayName}
                </p>
                <div className="mt-2 flex flex-wrap gap-3">
                  {detail.fileUrl && (
                    <>
                      <a
                        href={detail.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[#6366f1] hover:underline"
                      >
                        Download
                      </a>
                      <a
                        href={`${detail.fileUrl}${detail.fileUrl.includes("?") ? "&" : "?"}inline=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[#6366f1] hover:underline"
                      >
                        Open in online PDF viewer
                      </a>
                    </>
                  )}
                  {detail.externalLink && (
                    <a
                      href={detail.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[#6366f1] hover:underline"
                    >
                      Open link
                    </a>
                  )}
                </div>
              </section>
            )}

            {detail.content && (
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9ca3af]">
                  Content
                </p>
                <div className="mt-1 rounded-lg bg-white dark:bg-[#1f2937] border border-[#e5e7eb] dark:border-[#374151] p-4 text-sm text-[#374151] dark:text-[#d1d5db] whitespace-pre-wrap">
                  {detail.content}
                </div>
              </section>
            )}

            {mode === "admin" && detail.feedback?.length > 0 && (
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9ca3af]">
                  Mentor evaluation
                </p>
                <div className="mt-1 rounded-lg bg-white dark:bg-[#1f2937] border border-[#e5e7eb] dark:border-[#374151] p-4 text-sm">
                  {detail.feedback[detail.feedback.length - 1]?.grade && (
                    <p className="font-medium text-[#171717] dark:text-[#f9fafb]">
                      Grade: {detail.feedback[detail.feedback.length - 1].grade}
                    </p>
                  )}
                  {detail.feedback[detail.feedback.length - 1]?.comment && (
                    <p className="mt-1 text-[#374151] dark:text-[#d1d5db] whitespace-pre-wrap">
                      {detail.feedback[detail.feedback.length - 1].comment}
                    </p>
                  )}
                </div>
              </section>
            )}

            {showGradeForm && (
              <>
                {mode === "mentor" && (
                  <section>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9ca3af] mb-2">
                      Grade
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {GRADES.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGrade(g)}
                          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                            grade === g
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-white dark:bg-[#1f2937] text-[#374151] dark:text-[#d1d5db] border-[#e5e7eb] dark:border-[#374151] hover:border-[#6366f1]"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9ca3af] mb-2">
                    {mode === "admin" ? "Admin comment (optional)" : "Note"}
                  </p>
                  <textarea
                    value={mode === "admin" ? adminComment : note}
                    onChange={(e) => (mode === "admin" ? setAdminComment(e.target.value) : setNote(e.target.value))}
                    placeholder="Type here..."
                    rows={4}
                    className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-3 py-2.5 text-sm text-[#171717] dark:text-[#f9fafb] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  />
                </section>

                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={submitting}
                    className="rounded-lg bg-[#6366f1] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#4f46e5] disabled:opacity-50"
                  >
                    {mode === "admin" ? "Approve and publish grade" : "Accept and publish grade"}
                  </button>
                  <button
                    type="button"
                    onClick={handleResubmission}
                    disabled={submitting}
                    className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Resubmission required
                  </button>
                </div>
              </>
            )}

            {detail.status !== "PENDING" && detail.status !== "PENDING_ADMIN_APPROVAL" && (
              <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">
                This submission has already been evaluated.
              </p>
            )}
          </div>
        )}
        {!loadingDetail && !detail && selectedId && (
          <p className="text-[#6b7280] dark:text-[#9ca3af]">Could not load submission.</p>
        )}
        {!loadingDetail && !selectedId && submissions.length === 0 && (
          <p className="text-[#6b7280] dark:text-[#9ca3af]">No submissions for this assignment.</p>
        )}
      </main>
    </div>
  );
}
