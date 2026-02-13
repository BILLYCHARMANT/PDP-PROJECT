"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AssignmentGradingView } from "./AssignmentGradingView";

type Submission = {
  id: string;
  assignmentId: string;
  status?: string;
  assignment: { id: string; title: string };
  trainee: { id: string; name: string | null; email: string | null };
  feedback?: { id: string }[];
};

export function MentorGradingPageClient({ backHref }: { backHref: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/submissions")
      .then((r) => r.json())
      .then((data) => {
        setSubmissions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const assignments = useMemo(() => {
    const byId = new Map<string | undefined, { id: string; title: string }>();
    submissions.forEach((s) => {
      if (s.assignment?.id) byId.set(s.assignment.id, { id: s.assignment.id, title: s.assignment.title });
    });
    return Array.from(byId.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [submissions]);

  const filteredSubmissions = useMemo(
    () =>
      selectedAssignmentId
        ? submissions.filter((s) => s.assignmentId === selectedAssignmentId)
        : [],
    [submissions, selectedAssignmentId]
  );

  const assignmentTitle =
    selectedAssignmentId && assignments.find((a) => a.id === selectedAssignmentId)?.title;

  if (loading) {
    return <p className="text-[#6b7280] dark:text-[#9ca3af]">Loading…</p>;
  }

  if (assignments.length === 0) {
    return (
      <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-8 text-center">
        <p className="text-[#6b7280] dark:text-[#9ca3af]">No submissions to grade.</p>
      </div>
    );
  }

  if (!selectedAssignmentId) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-shrink-0 mb-4">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-4 py-2.5 text-sm font-medium text-[#374151] dark:text-[#d1d5db] shadow-sm hover:bg-[#f9fafb] dark:hover:bg-[#374151] hover:border-[#6366f1] hover:text-[#6366f1] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Submissions
          </Link>
        </div>
        <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-6 flex-1 min-h-0 overflow-auto">
          <p className="text-sm font-semibold text-[#6b7280] dark:text-[#9ca3af] mb-3">
            Select an assignment
          </p>
          <ul className="space-y-2">
            {assignments.map((a) => {
              const count = submissions.filter((s) => s.assignmentId === a.id).length;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedAssignmentId(a.id)}
                    className="w-full text-left rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827] px-4 py-3 hover:border-[#6366f1] transition-colors"
                  >
                    <span className="font-medium text-[#171717] dark:text-[#f9fafb]">{a.title}</span>
                    <span className="ml-2 text-sm text-[#6b7280] dark:text-[#9ca3af]">
                      ({count} submission{count !== 1 ? "s" : ""})
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-shrink-0 mb-4">
        <div className="inline-flex items-center rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] shadow-sm overflow-hidden">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#374151] dark:text-[#d1d5db] hover:bg-[#f9fafb] dark:hover:bg-[#374151] hover:text-[#6366f1] transition-colors border-r border-[#e5e7eb] dark:border-[#374151]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Submissions
          </Link>
          <div className="flex items-center gap-2 px-3 py-2 bg-[#f9fafb] dark:bg-[#111827]">
            <span className="text-xs font-medium text-[#6b7280] dark:text-[#9ca3af]">Assignment</span>
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="text-sm font-medium text-[#171717] dark:text-[#f9fafb] bg-transparent border-0 cursor-pointer focus:ring-0 focus:outline-none py-0 pr-6"
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <AssignmentGradingView
          submissions={filteredSubmissions.map((s) => ({
            id: s.id,
            status: s.status ?? "PENDING",
            trainee: s.trainee,
            feedback: s.feedback?.map((f) => ({ id: f.id })) ?? [],
          }))}
          assignmentTitle={assignmentTitle ?? ""}
          mode="mentor"
          backHref={backHref}
        />
      </div>
    </div>
  );
}
