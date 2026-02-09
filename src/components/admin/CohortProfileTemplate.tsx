"use client";

import { useState } from "react";
import Link from "next/link";
import { CohortProfileCard } from "@/components/admin/CohortProfileCard";
import { DeleteCohortButton } from "@/components/admin/DeleteCohortButton";
import { EnrollTrainees } from "@/components/admin/EnrollTrainees";
import { EnrolledTraineesTable } from "@/components/admin/EnrolledTraineesTable";
import { CohortStatsSummary } from "@/components/admin/CohortStatsSummary";

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

type TabId = "trainees" | "course" | "summary";

export function CohortProfileTemplate({
  cohortId,
  cohortName,
  program,
  mentor,
  enrollmentCount,
  enrollments,
  progressData,
  submissionData,
  moduleCount,
  programs,
  mentors,
  trainees,
  initialForm,
}: {
  cohortId: string;
  cohortName: string;
  program: { id: string; name: string } | null;
  mentor: { id: string; name: string; email: string } | null;
  enrollmentCount: number;
  enrollments: Enrollment[];
  progressData: ProgressData[];
  submissionData: SubmissionData[];
  moduleCount: number;
  programs: Program[];
  mentors: Mentor[];
  trainees: { id: string; name: string; email: string }[];
  initialForm: { name?: string; programId?: string | null; mentorId?: string | null };
}) {
  const [activeTab, setActiveTab] = useState<TabId>("trainees");
  const [newDropdownOpen, setNewDropdownOpen] = useState(false);

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "trainees", label: "Trainees", count: enrollmentCount },
    { id: "course", label: "Assigned course", count: program ? 1 : 0 },
    { id: "summary", label: "Summary" },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/admin/cohorts"
        className="text-sm font-medium text-[#6b7280] hover:text-[#171717]"
      >
        ← Cohorts
      </Link>

      {/* Big title - Hope LMS style */}
      <h1 className="text-2xl md:text-3xl font-bold text-[#171717]">
        {cohortName}
      </h1>

      {/* Compact cohort info bar - UNIPOD list style */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#4b5563]">
              {program ? program.name : "No course assigned"}
              {mentor && ` · Mentor: ${mentor.name}`}
            </p>
            <p className="text-xs text-[#6b7280] mt-0.5">
              {enrollmentCount} trainee{enrollmentCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="#cohort-profile"
              className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]"
            >
              Edit
            </a>
            <DeleteCohortButton
              cohortId={cohortId}
              cohortName={cohortName}
              enrollmentCount={enrollmentCount}
            />
          </div>
        </div>
      </div>

      {/* Cohort profile card (edit form) */}
      <CohortProfileCard
        cohortId={cohortId}
        cohortName={cohortName}
        assignedProgramId={program?.id ?? null}
        mentor={mentor}
        enrollmentCount={enrollmentCount}
        programs={programs}
        mentors={mentors}
        initial={initialForm}
        hideDelete
      />

      {/* Tabs + Action bar - Hope LMS style */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#e5e7eb] bg-[#fafafa] px-4">
          <div className="flex flex-wrap items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-white text-[#171717] shadow-sm border border-[#e5e7eb]"
                      : "text-[#6b7280] hover:text-[#374151] hover:bg-white/60"
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-1.5 text-[#9ca3af]">({tab.count})</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {activeTab === "trainees" && (
                <>
                  <div className="relative rounded-lg border border-[#e5e7eb] bg-white flex items-center">
                    <span className="pl-3 text-sm text-[#6b7280]">All</span>
                    <span className="sr-only">Filter</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search trainees..."
                      className="w-48 rounded-lg border border-[#e5e7eb] bg-white pl-9 pr-3 py-2 text-sm placeholder:text-[#9ca3af]"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNewDropdownOpen((o) => !o)}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: "var(--unipod-blue, #2563eb)" }}
                >
                  <span className="text-lg leading-none">+</span>
                  New
                </button>
                {newDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setNewDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-[#e5e7eb] bg-white py-1 shadow-lg">
                      <a
                        href="#enroll-trainees"
                        onClick={() => setNewDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]"
                      >
                        Add trainees
                      </a>
                      <a
                        href="#cohort-profile"
                        onClick={() => setNewDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]"
                      >
                        Assign course
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === "trainees" && (
            <div id="enroll-trainees" className="space-y-6">
              <div className="rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-4">
                <p className="text-sm font-medium text-[#374151] mb-3">Add trainees to this cohort</p>
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
                <p className="text-sm text-[#6b7280] py-8 text-center">
                  No trainees enrolled yet. Use the form above to enroll trainees.
                </p>
              )}
            </div>
          )}

          {activeTab === "course" && (
            <div className="space-y-4">
              {program ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/dashboard/admin/programs/${program.id}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 text-sm font-medium text-[#171717] hover:bg-[#f3f4f6]"
                  >
                    <span>{program.name}</span>
                    <span className="text-[#6b7280]">→ View course</span>
                  </Link>
                  <a
                    href="#cohort-profile"
                    className="inline-flex items-center rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]"
                  >
                    Change course
                  </a>
                </div>
              ) : (
                <p className="text-sm text-[#6b7280]">
                  No course assigned. Use &quot;+ New&quot; → Assign course or edit the cohort profile above.
                </p>
              )}
            </div>
          )}

          {activeTab === "summary" && (
            <CohortStatsSummary
              enrollments={enrollments.map((e) => ({ traineeId: e.traineeId, atRisk: e.atRisk }))}
              progressData={progressData}
              submissionData={submissionData}
              moduleCount={moduleCount}
            />
          )}
        </div>
      </div>
    </div>
  );
}
