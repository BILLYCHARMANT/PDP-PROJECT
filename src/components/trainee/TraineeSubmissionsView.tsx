"use client";

import { useState, useEffect, useMemo } from "react";

type SubmissionItem = {
  id: string;
  assignmentId: string;
  assignment: { id: string; title: string; module?: { title: string } };
  status: string;
  submittedAt: string;
};

type SubmissionDetail = {
  id: string;
  content: string | null;
  fileUrl: string | null;
  externalLink: string | null;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  assignment: {
    id: string;
    title: string;
    moduleId: string;
    module?: { id: string; title: string; programId: string };
  };
  trainee: { id: string; name: string | null; email: string | null };
  feedback: {
    id: string;
    comment: string | null;
    grade: string | null;
    adminComment: string | null;
    mentor?: { name: string | null };
  }[];
};

export function TraineeSubmissionsView() {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetch("/api/submissions")
      .then((r) => r.json())
      .then((data) => {
        setSubmissions(Array.isArray(data) ? data : []);
        setLoading(false);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return submissions;
    const q = search.toLowerCase();
    return submissions.filter(
      (s) =>
        s.assignment.title?.toLowerCase().includes(q) ||
        s.assignment.module?.title?.toLowerCase().includes(q)
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
      })
      .catch(() => setDetail(null))
      .finally(() => setLoadingDetail(false));
  }, [selectedId]);

  const statusColors: Record<string, string> = {
    PENDING: "text-amber-600 dark:text-amber-400",
    PENDING_ADMIN_APPROVAL: "text-blue-600 dark:text-blue-400",
    APPROVED: "text-emerald-600 dark:text-emerald-400",
    REJECTED: "text-red-600 dark:text-red-400",
    RESUBMIT_REQUESTED: "text-orange-600 dark:text-orange-400",
  };

  const fileDisplayName = detail?.fileUrl
    ? detail.fileUrl.split("/").pop() ?? "Submitted file"
    : detail?.externalLink
      ? "External link"
      : null;

  if (loading) {
    return (
      <div className="flex flex-1 min-h-0 h-full rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] overflow-hidden">
        <p className="p-6 text-[#6b7280] dark:text-[#9ca3af]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 h-full rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] overflow-hidden">
      {/* Left: assignment list */}
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
            aria-label="Search assignments"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-[#6b7280] dark:text-[#9ca3af]">No submissions found.</p>
          ) : (
            filtered.map((s) => (
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
                <p className="font-medium text-sm">{s.assignment.title}</p>
                {s.assignment.module?.title && (
                  <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-0.5">{s.assignment.module.title}</p>
                )}
                <p className={`text-xs mt-1 font-medium ${statusColors[s.status] || "text-[#6b7280]"}`}>
                  {s.status.replace(/_/g, " ")}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Right: submission detail */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-[#f5f5f7] dark:bg-[#111827] p-6">
        {loadingDetail && <p className="text-[#6b7280] dark:text-[#9ca3af]">Loading…</p>}
        {!loadingDetail && detail && (
          <div className="max-w-2xl space-y-6">
            <h1 className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">
              {detail.assignment.title}
            </h1>

            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9ca3af]">
                Status
              </p>
              <p className={`mt-1 text-base font-medium ${statusColors[detail.status] || "text-[#374151] dark:text-[#d1d5db]"}`}>
                {detail.status === "PENDING_ADMIN_APPROVAL"
                  ? "Submitted (pending admin confirmation)"
                  : detail.status.replace(/_/g, " ")}
              </p>
              <p className="mt-0.5 text-sm text-[#6b7280] dark:text-[#9ca3af]">
                On {new Date(detail.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </section>

            {/* Workflow progress */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9ca3af] mb-3">
                Progress
              </p>
              <div className="relative">
                {/* Progress steps */}
                <div className="flex items-center gap-2">
                  {/* Step 1: Submitted */}
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        detail.status !== "PENDING"
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "bg-white dark:bg-[#1f2937] border-[#6366f1] text-[#6366f1]"
                      }`}
                    >
                      {detail.status !== "PENDING" ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="text-xs font-bold">1</span>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-medium text-center text-[#171717] dark:text-[#f9fafb]">Submitted</p>
                  </div>

                  {/* Connector line */}
                  <div
                    className={`flex-1 h-0.5 ${
                      detail.status === "PENDING" ? "bg-[#e5e7eb] dark:bg-[#374151]" : "bg-emerald-500"
                    }`}
                  />

                  {/* Step 2: Mentor review */}
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        detail.status === "APPROVED" || detail.status === "REJECTED" || detail.status === "PENDING_ADMIN_APPROVAL" || detail.status === "RESUBMIT_REQUESTED"
                          ? detail.status === "RESUBMIT_REQUESTED"
                            ? "bg-orange-500 border-orange-500 text-white"
                            : "bg-emerald-500 border-emerald-500 text-white"
                          : detail.status === "PENDING"
                            ? "bg-white dark:bg-[#1f2937] border-[#e5e7eb] dark:border-[#374151] text-[#9ca3af]"
                            : "bg-white dark:bg-[#1f2937] border-[#6366f1] text-[#6366f1]"
                      }`}
                    >
                      {detail.status === "APPROVED" || detail.status === "REJECTED" || detail.status === "PENDING_ADMIN_APPROVAL" || detail.status === "RESUBMIT_REQUESTED" ? (
                        detail.status === "RESUBMIT_REQUESTED" ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )
                      ) : detail.status === "PENDING" ? (
                        <span className="text-xs font-bold text-[#9ca3af]">2</span>
                      ) : (
                        <span className="text-xs font-bold">2</span>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-medium text-center text-[#171717] dark:text-[#f9fafb]">Mentor review</p>
                    {detail.status === "PENDING" && (
                      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">Awaiting mentor</p>
                    )}
                    {detail.status === "PENDING_ADMIN_APPROVAL" && detail.feedback.length > 0 && (
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">Mentor evaluated</p>
                    )}
                    {detail.status === "RESUBMIT_REQUESTED" && (
                      <p className="mt-1 text-xs text-orange-600 dark:text-orange-400 font-medium">Resubmission needed</p>
                    )}
                  </div>

                  {/* Connector line */}
                  <div
                    className={`flex-1 h-0.5 ${
                      detail.status === "APPROVED" || detail.status === "REJECTED"
                        ? "bg-emerald-500"
                        : detail.status === "PENDING_ADMIN_APPROVAL"
                          ? "bg-blue-500"
                          : detail.status === "RESUBMIT_REQUESTED"
                            ? "bg-orange-500"
                            : "bg-[#e5e7eb] dark:bg-[#374151]"
                    }`}
                  />

                  {/* Step 3: Admin confirmation */}
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        detail.status === "APPROVED" || detail.status === "REJECTED"
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : detail.status === "PENDING_ADMIN_APPROVAL"
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "bg-white dark:bg-[#1f2937] border-[#e5e7eb] dark:border-[#374151] text-[#9ca3af]"
                      }`}
                    >
                      {detail.status === "APPROVED" || detail.status === "REJECTED" ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : detail.status === "PENDING_ADMIN_APPROVAL" ? (
                        <span className="text-xs font-bold">3</span>
                      ) : (
                        <span className="text-xs font-bold text-[#9ca3af]">3</span>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-medium text-center text-[#171717] dark:text-[#f9fafb]">Admin confirmation</p>
                    {detail.status === "PENDING_ADMIN_APPROVAL" && (
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">Awaiting admin</p>
                    )}
                  </div>

                  {/* Connector line */}
                  <div
                    className={`flex-1 h-0.5 ${
                      detail.status === "APPROVED" ? "bg-emerald-500" : "bg-[#e5e7eb] dark:bg-[#374151]"
                    }`}
                  />

                  {/* Step 4: Completed */}
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        detail.status === "APPROVED"
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "bg-white dark:bg-[#1f2937] border-[#e5e7eb] dark:border-[#374151] text-[#9ca3af]"
                      }`}
                    >
                      {detail.status === "APPROVED" ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="text-xs font-bold text-[#9ca3af]">4</span>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-medium text-center text-[#171717] dark:text-[#f9fafb]">Completed</p>
                    {detail.status === "APPROVED" && (
                      <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">Assessed</p>
                    )}
                  </div>
                </div>
              </div>
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
                  Your submission
                </p>
                <div className="mt-1 rounded-lg bg-white dark:bg-[#1f2937] border border-[#e5e7eb] dark:border-[#374151] p-4 text-sm text-[#374151] dark:text-[#d1d5db] whitespace-pre-wrap">
                  {detail.content}
                </div>
              </section>
            )}

            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9ca3af]">
                Grade & feedback
              </p>
              {detail.status === "PENDING" && (
                <div className="mt-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <span className="font-medium">No feedback yet.</span> Your submission is awaiting mentor review.
                  </p>
                </div>
              )}
              {detail.status === "PENDING_ADMIN_APPROVAL" && detail.feedback && detail.feedback.length > 0 && (
                <div className="mt-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 mb-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <span className="font-medium">Mentor evaluation complete.</span> Awaiting admin confirmation.
                  </p>
                </div>
              )}
              {detail.status === "RESUBMIT_REQUESTED" && detail.feedback && detail.feedback.length > 0 && (
                <div className="mt-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 mb-3">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <span className="font-medium">Resubmission requested.</span> Please review the feedback below and submit an updated version.
                  </p>
                </div>
              )}
              {detail.feedback && detail.feedback.length > 0 && (
                <>
                  {detail.feedback.map((f, idx) => (
                    <div key={f.id} className={`mt-2 rounded-lg bg-white dark:bg-[#1f2937] border border-[#e5e7eb] dark:border-[#374151] p-4 ${idx > 0 ? "mt-3" : ""}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          Mentor feedback
                        </div>
                        {detail.status === "PENDING_ADMIN_APPROVAL" && (
                          <div className="px-2 py-1 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                            Pending admin confirmation
                          </div>
                        )}
                        {detail.status === "REJECTED" && (
                          <div className="px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                            Rejected
                          </div>
                        )}
                        {detail.status === "RESUBMIT_REQUESTED" && (
                          <div className="px-2 py-1 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                            Resubmission requested
                          </div>
                        )}
                        {detail.status === "APPROVED" && (f as { adminApprovedAt?: string | Date }).adminApprovedAt && (
                          <div className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                            Final assessment
                          </div>
                        )}
                      </div>
                      {f.grade && (
                        <p className="text-lg font-bold text-[#171717] dark:text-[#f9fafb] mb-2">
                          Grade: {f.grade}
                        </p>
                      )}
                      {f.comment && (
                        <div>
                          <p className="text-xs font-medium text-[#6b7280] dark:text-[#9ca3af] mb-1">Mentor's comment:</p>
                          <p className="text-sm text-[#374151] dark:text-[#d1d5db] whitespace-pre-wrap">
                            {f.comment}
                          </p>
                        </div>
                      )}
                      {f.adminComment && (
                        <div className="mt-4 pt-4 border-t border-[#e5e7eb] dark:border-[#374151]">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                              Admin confirmed
                            </div>
                          </div>
                          <p className="text-xs font-medium text-[#6b7280] dark:text-[#9ca3af] mb-1">Admin's note:</p>
                          <p className="text-sm text-[#374151] dark:text-[#d1d5db] whitespace-pre-wrap">
                            {f.adminComment}
                          </p>
                        </div>
                      )}
                      {(f as unknown as { adminApprovedAt?: string | Date }).adminApprovedAt && (
                        <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-3 pt-3 border-t border-[#e5e7eb] dark:border-[#374151]">
                          Final confirmation on {new Date((f as unknown as { adminApprovedAt: string | Date }).adminApprovedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  ))}
                </>
              )}
              {detail.status === "APPROVED" && (!detail.feedback || detail.feedback.length === 0) && (
                <div className="mt-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    <span className="font-medium">Assessment completed.</span> Your submission has been approved.
                  </p>
                </div>
              )}
              {detail.status === "REJECTED" && (!detail.feedback || detail.feedback.length === 0) && (
                <div className="mt-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <span className="font-medium">Submission rejected.</span> Please check feedback above or contact your mentor.
                  </p>
                </div>
              )}
            </section>

            {detail.status === "RESUBMIT_REQUESTED" && (
              <section className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-4">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Resubmission requested
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Your mentor has requested a resubmission. Please update your submission from the assignment page.
                </p>
                {(() => {
                  const mod = detail.assignment.module as { id: string; programId?: string; course?: { programId: string } } | undefined;
                  const programId = mod?.course?.programId ?? mod?.programId;
                  return programId && mod?.id ? (
                  <a
                    href={`/dashboard/trainee/learn/${programId}/${mod.id}/assignment/${detail.assignment.id}`}
                    className="inline-block mt-3 text-sm font-medium text-orange-800 dark:text-orange-200 hover:underline"
                  >
                    Go to assignment →
                  </a>
                  ) : null;
                })()}
              </section>
            )}
          </div>
        )}
        {!loadingDetail && !detail && selectedId && (
          <p className="text-[#6b7280] dark:text-[#9ca3af]">Could not load submission.</p>
        )}
        {!loadingDetail && !selectedId && submissions.length === 0 && (
          <p className="text-[#6b7280] dark:text-[#9ca3af]">No submissions yet.</p>
        )}
      </main>
    </div>
  );
}
