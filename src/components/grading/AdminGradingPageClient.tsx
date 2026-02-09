"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AssignmentGradingView } from "./AssignmentGradingView";

type Submission = {
  id: string;
  assignmentId: string;
  assignment: { id: string; title: string };
  trainee: { id: string; name: string | null; email: string | null };
};

export function AdminGradingPageClient({ backHref }: { backHref: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/submissions?status=PENDING_ADMIN_APPROVAL")
      .then((r) => r.json())
      .then((data) => {
        setSubmissions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const assignments = useMemo(() => {
    const byId = new Map<string, { id: string; title: string }>();
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

  useEffect(() => {
    if (assignments.length > 0 && !selectedAssignmentId) {
      setSelectedAssignmentId(assignments[0].id);
    }
  }, [assignments, selectedAssignmentId]);

  if (submissions.length === 0) {
    return (
      <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-8 text-center">
        <p className="text-[#6b7280] dark:text-[#9ca3af]">
          No submissions pending admin confirmation. Mentor-evaluated submissions will appear here.
        </p>
      </div>
    );
  }

  if (!selectedAssignmentId) {
    return <p className="text-[#6b7280] dark:text-[#9ca3af]">Loading…</p>;
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
          {assignments.length > 1 ? (
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
          ) : (
            <div className="px-3 py-2 bg-[#f9fafb] dark:bg-[#111827]">
              <span className="text-sm font-medium text-[#171717] dark:text-[#f9fafb]">{assignmentTitle}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <AssignmentGradingView
          submissions={filteredSubmissions}
          assignmentTitle={assignmentTitle ?? ""}
          mode="admin"
          backHref={backHref}
        />
      </div>
    </div>
  );
}
