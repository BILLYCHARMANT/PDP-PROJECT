"use client";

import { useState } from "react";
import Link from "next/link";
import { CohortStatsSummary } from "@/components/admin/CohortStatsSummary";
import { EnrollTrainees } from "@/components/admin/EnrollTrainees";
import { EnrolledTraineesTable } from "@/components/admin/EnrolledTraineesTable";
import { AssignCoursesToCohortModal } from "@/components/admin/AssignCoursesToCohortModal";

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
  courses,
  mentors,
  trainees,
  initial,
  assignedCourseIds = [],
  assignedCourses = [],
}: {
  cohortId: string;
  cohortName: string;
  assignedProgram: { id: string; name: string } | null;
  assignedCourseIds?: string[];
  assignedCourses?: Array<{ id: string; name: string }>;
  mentor: { id: string; name: string; email: string } | null;
  enrollments: Enrollment[];
  progressData: ProgressData[];
  submissionData: SubmissionData[];
  moduleCount: number;
  programs: Program[];
  courses?: Array<{ id: string; name: string; programId: string | null }>;
  mentors: Mentor[];
  trainees: { id: string; name: string; email: string }[];
  initial: { name?: string; programId?: string | null; mentorId?: string | null };
}) {
  const [assignCourseModalOpen, setAssignCourseModalOpen] = useState(false);

  const openAssignCourseModal = () => setAssignCourseModalOpen(true);

  return (
    <div className="space-y-8" id="cohort-profile">
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

      {/* Two panels: Courses | Trainees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Courses – assigning and assigned */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-[#e5e7eb] bg-[#f9fafb] px-5 py-4">
            <h2 className="text-base font-semibold text-[#0f172a]">Courses</h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              Assign courses to this cohort and view assigned courses
            </p>
          </div>
          <div className="p-5 flex flex-col flex-1 min-h-0">
            <div className="mb-4">
              <button
                type="button"
                onClick={openAssignCourseModal}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: "var(--unipod-blue, #2563eb)" }}
              >
                Assign new course
              </button>
            </div>
            <div className="overflow-x-auto flex-1 min-h-0">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                      Assigned courses
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {assignedCourses.length > 0 ? (
                    assignedCourses.map((course) => (
                      <tr key={course.id} className="hover:bg-[#fafafa]">
                        <td className="px-3 py-2 font-medium text-[#171717] text-sm">{course.name}</td>
                        <td className="px-3 py-2">
                          <Link
                            href={`/dashboard/admin/programs/${course.id}`}
                            className="text-sm font-medium"
                            style={{ color: "var(--unipod-blue, #2563eb)" }}
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-3 py-6 text-center text-sm text-[#6b7280]">
                        No courses assigned. Assign a program first (Edit), then use &quot;Assign new course&quot;.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Panel 2: Trainees – assigning and assigned */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm overflow-hidden flex flex-col" id="enroll-trainees">
          <div className="border-b border-[#e5e7eb] bg-[#f9fafb] px-5 py-4">
            <h2 className="text-base font-semibold text-[#0f172a]">Trainees</h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              Assign trainees to this cohort and view enrolled trainees
            </p>
          </div>
          <div className="p-5 flex flex-col flex-1 min-h-0">
            <div className="mb-4 rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-4">
              <p className="text-sm font-medium text-[#374151] mb-2">Assign new trainee</p>
              <EnrollTrainees
                cohortId={cohortId}
                enrolled={enrollments.map((e) => e.trainee)}
                trainees={trainees}
              />
            </div>
            <div className="flex-1 min-h-0">
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
          </div>
        </div>
      </div>

      {/* Assign courses to cohort modal */}
      {assignCourseModalOpen && (
        <AssignCoursesToCohortModal
          programId={assignedProgram?.id ?? null}
          programName={assignedProgram?.name ?? null}
          assignedCourseIds={assignedCourseIds}
          onClose={() => setAssignCourseModalOpen(false)}
          onSuccess={() => setAssignCourseModalOpen(false)}
        />
      )}
    </div>
  );
}
