"use client";

import { useState } from "react";
import Link from "next/link";
import { DeleteCohortButton } from "@/components/admin/DeleteCohortButton";
import { CohortForm } from "@/components/admin/CohortForm";
import { CohortStatsSummary } from "@/components/admin/CohortStatsSummary";
import { EnrollTrainees } from "@/components/admin/EnrollTrainees";
import { EnrolledTraineesTable } from "@/components/admin/EnrolledTraineesTable";

type Program = { id: string; name: string };
type Mentor = { id: string; name: string; email: string };
type Enrollment = {
  id: string;
  traineeId: string;
  enrolledAt: Date | string;
  atRisk: boolean;
  extendedEndDate: Date | string | null;
  lastReminderAt: Date | string | null;
  trainee: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    active: boolean;
    createdAt: Date | string;
    imageUrl: string | null;
  };
};
type ProgressData = { traineeId: string; moduleId: string; percentComplete: number; status: string; completedAt: Date | string | null };
type SubmissionData = { traineeId: string; status: string; submittedAt: Date | string; reviewedAt: Date | string | null };

export function CohortDetailSections({
  cohortId,
  cohortName,
  assignedProgram,
  mentor,
  enrollments,
  progressData,
  submissionData,
  moduleCount,
  programs,
  mentors,
  trainees,
  initial,
}: {
  cohortId: string;
  cohortName: string;
  assignedProgram: { id: string; name: string } | null;
  mentor: { id: string; name: string; email: string } | null;
  enrollments: Enrollment[];
  progressData: ProgressData[];
  submissionData: SubmissionData[];
  moduleCount: number;
  programs: Program[];
  mentors: Mentor[];
  trainees: { id: string; name: string; email: string }[];
  initial: { name?: string; programId?: string | null; mentorId?: string | null };
}) {
  const [editModalOpen, setEditModalOpen] = useState(false);

  const openEditModal = () => setEditModalOpen(true);

  return (
    <div className="space-y-8" id="cohort-profile">
      {/* Cohort header: name, mentor, Edit, Delete */}
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
            onClick={openEditModal}
            className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]"
          >
            Edit
          </button>
          <DeleteCohortButton
            cohortId={cohortId}
            cohortName={cohortName}
            enrollmentCount={enrollments.length}
          />
        </div>
      </div>

      {/* Statistical cards */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-4">Cohort summary</p>
        <CohortStatsSummary
          enrollments={enrollments.map((e) => ({ traineeId: e.traineeId, atRisk: e.atRisk }))}
          progressData={progressData}
          submissionData={submissionData}
          moduleCount={moduleCount}
        />
      </div>

      {/* Courses assigned to this cohort - table + Assign new course button */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
            Courses assigned to this cohort
          </p>
          <button
            type="button"
            onClick={openEditModal}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--unipod-blue, #2563eb)" }}
          >
            Assign new course
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                  Course
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {assignedProgram ? (
                <tr className="hover:bg-[#fafafa]">
                  <td className="px-4 py-3 font-medium text-[#171717]">{assignedProgram.name}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/admin/programs/${assignedProgram.id}`}
                      className="text-sm font-medium"
                      style={{ color: "var(--unipod-blue, #2563eb)" }}
                    >
                      View course →
                    </Link>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-sm text-[#6b7280]">
                    No course assigned. Use &quot;Assign new course&quot; to assign one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enrolled trainees - Assign new trainee button */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm" id="enroll-trainees">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
            Enrolled trainees ({enrollments.length})
          </p>
          <a
            href="#enroll-trainees"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            style={{ backgroundColor: "var(--unipod-blue, #2563eb)" }}
          >
            Assign new trainee
          </a>
        </div>
        <div className="mb-4 rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-4">
          <p className="text-sm font-medium text-[#374151] mb-3">Assign new trainee to this cohort</p>
          <EnrollTrainees
            cohortId={cohortId}
            enrolled={enrollments.map((e) => e.trainee)}
            trainees={trainees}
          />
        </div>
        {enrollments.length > 0 ? (
          <EnrolledTraineesTable
            enrollments={enrollments}
            progressData={progressData}
            submissionData={submissionData}
            moduleCount={moduleCount}
          />
        ) : (
          <p className="text-sm text-[#6b7280] py-4 text-center">
            No trainees enrolled yet. Use the form above to assign trainees.
          </p>
        )}
      </div>

      {/* Edit details modal */}
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
              mentors={mentors}
              initial={initial}
              onSuccess={() => setEditModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
