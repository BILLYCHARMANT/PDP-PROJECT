"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

const GRADES = ["A+", "A", "B+", "B", "C", "D"] as const;

type TraineeItem = {
  id: string;
  status: string;
  trainee: { id: string; name: string | null; email: string | null };
  feedback?: { id: string }[];
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
  // Admin can review and provide feedback for any submission that has mentor feedback
  const canGradeAdmin = mode === "admin" && detail?.feedback && detail.feedback.length > 0;
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
          {filtered.map((s) => {
            const hasMentorFeedback = s.feedback && s.feedback.length > 0;
            const statusColors: Record<string, string> = {
              PENDING: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
              PENDING_ADMIN_APPROVAL: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
              APPROVED: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
              REJECTED: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
              RESUBMIT_REQUESTED: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
            };
            return (
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
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{s.trainee.name || s.trainee.email || "Trainee"}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {hasMentorFeedback && (
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        ✓
                      </span>
                    )}
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[s.status] || "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300"}`}>
                      {s.status === "PENDING_ADMIN_APPROVAL" ? "Pending" : s.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
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
                    : detail.status === "APPROVED"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : detail.status === "REJECTED" || detail.status === "RESUBMIT_REQUESTED"
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-[#374151] dark:text-[#d1d5db]"
                }`}
              >
                {detail.status === "PENDING_ADMIN_APPROVAL" ? "Submitted (pending admin confirmation)" : detail.status.replace(/_/g, " ")}
              </p>
              <p className="mt-0.5 text-sm text-[#6b7280] dark:text-[#9ca3af]">
                On {new Date(detail.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </section>

            {/* Workflow progress indicator for admin */}
            {mode === "admin" && (
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9ca3af] mb-3">
                  Review Progress
                </p>
                <div className="relative">
                  <div className="flex items-center gap-2">
                    {/* Step 1: Submitted */}
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        detail.status !== "PENDING" ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white dark:bg-[#1f2937] border-[#6366f1] text-[#6366f1]"
                      }`}>
                        {detail.status !== "PENDING" ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="text-xs font-bold">1</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-center text-[#171717] dark:text-[#f9fafb]">Submitted</p>
                    </div>

                    <div className={`flex-1 h-0.5 ${detail.status !== "PENDING" ? "bg-emerald-500" : "bg-[#e5e7eb] dark:bg-[#374151]"}`} />

                    {/* Step 2: Mentor review */}
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        detail.feedback && detail.feedback.length > 0
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : detail.status === "PENDING"
                            ? "bg-white dark:bg-[#1f2937] border-[#e5e7eb] dark:border-[#374151] text-[#9ca3af]"
                            : "bg-white dark:bg-[#1f2937] border-[#6366f1] text-[#6366f1]"
                      }`}>
                        {detail.feedback && detail.feedback.length > 0 ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : detail.status === "PENDING" ? (
                          <span className="text-xs font-bold text-[#9ca3af]">2</span>
                        ) : (
                          <span className="text-xs font-bold">2</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-center text-[#171717] dark:text-[#f9fafb]">Mentor review</p>
                      {detail.feedback && detail.feedback.length > 0 && (
                        <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">Complete</p>
                      )}
                    </div>

                    <div className={`flex-1 h-0.5 ${
                      detail.status === "APPROVED" || detail.status === "REJECTED"
                        ? "bg-emerald-500"
                        : detail.status === "PENDING_ADMIN_APPROVAL"
                          ? "bg-blue-500"
                          : detail.feedback && detail.feedback.length > 0
                            ? "bg-blue-500"
                            : "bg-[#e5e7eb] dark:bg-[#374151]"
                    }`} />

                    {/* Step 3: Admin confirmation */}
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        detail.status === "APPROVED" || detail.status === "REJECTED"
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : detail.status === "PENDING_ADMIN_APPROVAL"
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "bg-white dark:bg-[#1f2937] border-[#e5e7eb] dark:border-[#374151] text-[#9ca3af]"
                      }`}>
                        {detail.status === "APPROVED" || detail.status === "REJECTED" ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : detail.status === "PENDING_ADMIN_APPROVAL" ? (
                          <span className="text-xs font-bold">3</span>
                        ) : (
                          <span className="text-xs font-bold text-[#9ca3af]">3</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-center text-[#171717] dark:text-[#f9fafb]">Admin confirmation</p>
                      {detail.status === "PENDING_ADMIN_APPROVAL" && (
                        <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400 font-medium">Pending</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

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

            {mode === "admin" && (
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9ca3af]">
                  Mentor evaluation
                </p>
                {detail.feedback && detail.feedback.length > 0 ? (
                  <div className="mt-1 space-y-3">
                    {detail.feedback.map((f, idx) => (
                      <div key={f.id} className={`rounded-lg bg-white dark:bg-[#1f2937] border border-[#e5e7eb] dark:border-[#374151] p-4 ${idx > 0 ? "mt-3" : ""}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            Mentor feedback
                          </div>
                          {f.mentor?.name && (
                            <span className="text-xs text-[#6b7280] dark:text-[#9ca3af]">
                              by {f.mentor.name}
                            </span>
                          )}
                        </div>
                        {f.grade && (
                          <p className="text-lg font-bold text-[#171717] dark:text-[#f9fafb] mb-2">
                            Grade: {f.grade}
                          </p>
                        )}
                        {f.comment && (
                          <div>
                            <p className="text-xs font-medium text-[#6b7280] dark:text-[#9ca3af] mb-1">Comment:</p>
                            <p className="text-sm text-[#374151] dark:text-[#d1d5db] whitespace-pre-wrap">
                              {f.comment}
                            </p>
                          </div>
                        )}
                        {f.adminComment && (
                          <div className="mt-3 pt-3 border-t border-[#e5e7eb] dark:border-[#374151]">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                                Admin reviewed
                              </div>
                            </div>
                            <p className="text-xs font-medium text-[#6b7280] dark:text-[#9ca3af] mb-1">Admin note:</p>
                            <p className="text-sm text-[#374151] dark:text-[#d1d5db] whitespace-pre-wrap">
                              {f.adminComment}
                            </p>
                            {f.adminApprovedAt && (
                              <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-2">
                                Confirmed on {new Date(f.adminApprovedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <span className="font-medium">No mentor feedback yet.</span> This submission is awaiting mentor review.
                    </p>
                  </div>
                )}
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

            {mode === "admin" && detail.feedback && detail.feedback.length > 0 && detail.status === "APPROVED" && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  <span className="font-medium">Submission approved.</span> This evaluation has been finalized.
                </p>
              </div>
            )}
            {mode === "admin" && detail.feedback && detail.feedback.length === 0 && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <span className="font-medium">Awaiting mentor evaluation.</span> Admin review will be available once mentor provides feedback.
                </p>
              </div>
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
