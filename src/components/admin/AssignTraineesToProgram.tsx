"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EnrollTrainees } from "@/components/admin/EnrollTrainees";
import { EnrolledTraineesTable } from "@/components/admin/EnrolledTraineesTable";
import Link from "next/link";

type Cohort = {
  id: string;
  name: string;
  programId: string | null;
  mentor: { id: string; name: string; email: string } | null;
  _count?: { enrollments: number };
};

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

type ProgressData = {
  traineeId: string;
  moduleId: string;
  percentComplete: number;
  status: string;
  completedAt: Date | string | null;
};

type SubmissionData = {
  traineeId: string;
  status: string;
  submittedAt: Date | string;
  reviewedAt: Date | string | null;
};

export function AssignTraineesToProgram({
  programId,
}: {
  programId: string;
}) {
  const router = useRouter();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [trainees, setTrainees] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [submissionData, setSubmissionData] = useState<SubmissionData[]>([]);
  const [moduleCount, setModuleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  useEffect(() => {
    // Fetch cohorts for this program
    fetch(`/api/cohorts?programId=${programId}`)
      .then((r) => r.json())
      .then((data: Cohort[]) => {
        const programCohorts = Array.isArray(data) ? data.filter((c) => c.programId === programId) : [];
        setCohorts(programCohorts);
        if (programCohorts.length > 0 && !selectedCohortId) {
          setSelectedCohortId(programCohorts[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch all trainees
    fetch("/api/users?role=TRAINEE")
      .then((r) => r.json())
      .then((data) => {
        setTrainees(Array.isArray(data) ? data : []);
      })
      .catch(() => {});

    // Fetch program modules count
    fetch(`/api/programs/${programId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.courses) {
          const totalModules = data.courses.reduce(
            (sum: number, course: any) => sum + (course.modules?.length || 0),
            0
          );
          setModuleCount(totalModules);
        }
      })
      .catch(() => {});
  }, [programId, selectedCohortId]);

  useEffect(() => {
    if (selectedCohortId) {
      setLoadingEnrollments(true);
      // Fetch enrollments for selected cohort
      fetch(`/api/cohorts/${selectedCohortId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.enrollments) {
            setEnrollments(data.enrollments);
            // Initialize empty progress/submission data for now
            // These can be fetched later if needed for detailed views
            setProgressData([]);
            setSubmissionData([]);
          }
          setLoadingEnrollments(false);
        })
        .catch(() => setLoadingEnrollments(false));
    }
  }, [selectedCohortId]);

  function handleEnrollmentSuccess() {
    router.refresh();
    // Reload enrollments
    if (selectedCohortId) {
      setLoadingEnrollments(true);
      fetch(`/api/cohorts/${selectedCohortId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.enrollments) {
            setEnrollments(data.enrollments);
          }
          setLoadingEnrollments(false);
        })
        .catch(() => setLoadingEnrollments(false));
    }
  }

  if (loading) {
    return <div className="text-sm text-[#6b7280] dark:text-[#9ca3af]">Loading cohorts...</div>;
  }

  if (cohorts.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">
          No cohorts found for this program. Create a cohort first to assign trainees.
        </p>
        <Link
          href="/dashboard/admin/cohorts/new"
          className="inline-block rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "var(--unipod-blue)" }}
        >
          Create Cohort
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cohort Selector */}
      <div>
        <label className="block text-sm font-medium text-[#171717] dark:text-[#f9fafb] mb-2">
          Select Cohort
        </label>
        <select
          value={selectedCohortId || ""}
          onChange={(e) => setSelectedCohortId(e.target.value)}
          className="w-full max-w-md rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-3 py-2 text-sm"
        >
          {cohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.name} ({cohort._count?.enrollments || 0} trainees)
            </option>
          ))}
        </select>
      </div>

      {selectedCohortId && (
        <>
          {/* Enroll Trainees Section */}
          <div className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-[#fafafa] dark:bg-[#111827] p-4">
            <p className="text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-3">
              Assign new trainee to this cohort
            </p>
            <EnrollTrainees
              cohortId={selectedCohortId}
              enrolled={enrollments.map((e) => e.trainee)}
              trainees={trainees}
              onSuccess={handleEnrollmentSuccess}
            />
          </div>

          {/* Enrolled Trainees Table */}
          {loadingEnrollments ? (
            <div className="text-sm text-[#6b7280] dark:text-[#9ca3af]">Loading enrollments...</div>
          ) : enrollments.length > 0 ? (
            <EnrolledTraineesTable
              enrollments={enrollments}
              progressData={progressData}
              submissionData={submissionData}
              moduleCount={moduleCount}
            />
          ) : (
            <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] py-4 text-center">
              No trainees enrolled in this cohort yet. Use the form above to assign trainees.
            </p>
          )}
        </>
      )}
    </div>
  );
}
