"use client";

import { useState } from "react";
import Link from "next/link";
import { DeleteCohortButton } from "@/components/admin/DeleteCohortButton";
import { CohortForm } from "@/components/admin/CohortForm";

type Program = { id: string; name: string };
type Mentor = { id: string; name: string; email: string };

export function CohortProfileCard({
  cohortId,
  cohortName,
  assignedProgramId,
  mentor,
  enrollmentCount,
  programs,
  courses,
  mentors,
  initial,
  hideDelete,
}: {
  cohortId: string;
  cohortName: string;
  assignedProgramId: string | null;
  mentor: { id: string; name: string; email: string } | null;
  enrollmentCount: number;
  programs: Program[];
  courses?: Array<{ id: string; name: string; programId: string | null }>;
  mentors: Mentor[];
  initial: { name?: string; programId?: string | null; mentorId?: string | null };
  hideDelete?: boolean;
}) {
  const [editModalOpen, setEditModalOpen] = useState(false);

  return (
    <div className="space-y-6" id="cohort-profile">
      {/* Compact cohort header: name, mentor, Edit, Delete */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e5e7eb] bg-white px-5 py-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">{cohortName}</h1>
          {mentor && (
            <p className="text-sm text-[#64748b] mt-0.5">
              Mentor: {mentor.name} · {mentor.email}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditModalOpen(true)}
            className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]"
          >
            Edit
          </button>
          {!hideDelete && (
            <DeleteCohortButton
              cohortId={cohortId}
              cohortName={cohortName}
              enrollmentCount={enrollmentCount}
            />
          )}
        </div>
      </div>

      {/* Course cards */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-4">
          Courses
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {programs.map((prog) => {
            const isAssigned = assignedProgramId === prog.id;
            return (
              <Link
                key={prog.id}
                href={`/dashboard/admin/programs/${prog.id}`}
                className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm hover:shadow transition-shadow hover:border-[#c7d2fe] block text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-[#0f172a] truncate flex-1" title={prog.name}>
                    {prog.name}
                  </p>
                  {isAssigned && (
                    <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      Assigned
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-[#64748b]">
                  {isAssigned ? "Assigned to this cohort" : "View course →"}
                </p>
              </Link>
            );
          })}
        </div>
        {programs.length === 0 && (
          <p className="text-sm text-[#64748b] rounded-2xl border border-[#e5e7eb] bg-white p-6 text-center">
            No courses yet. Create a course first to assign to this cohort.
          </p>
        )}
      </div>

      {/* Edit details modal - appears when Edit is clicked */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                Edit details
              </p>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-[#6b7280] hover:text-[#374151] p-1 rounded"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CohortForm
              cohortId={cohortId}
              programs={programs}
              allCourses={courses}
              mentors={mentors}
              initial={{ ...initial, programId: initial.programId ?? undefined, mentorId: initial.mentorId ?? undefined }}
              onSuccess={() => setEditModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
