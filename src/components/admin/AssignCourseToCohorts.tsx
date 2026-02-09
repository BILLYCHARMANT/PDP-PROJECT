"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Cohort = {
  id: string;
  name: string;
  programId?: string | null;
  program?: { id: string; name: string } | null;
  mentor?: { name: string } | null;
};

export function AssignCourseToCohorts({
  programId,
  assignedCohortIds,
}: {
  programId: string;
  assignedCohortIds: string[];
}) {
  const router = useRouter();
  const [availableCohorts, setAvailableCohorts] = useState<Cohort[]>([]);
  const [selectedCohortIds, setSelectedCohortIds] = useState<string[]>(assignedCohortIds);
  const [loading, setLoading] = useState(false);
  const [loadingCohorts, setLoadingCohorts] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/cohorts")
      .then((r) => r.json())
      .then((cohorts: Cohort[]) => {
        // Show all cohorts (unassigned ones and ones assigned to this course)
        // Cohorts assigned to other courses are filtered out
        const relevant = cohorts.filter((c) => {
          const cohortProgramId = c.programId ?? c.program?.id ?? null;
          return !cohortProgramId || cohortProgramId === programId;
        });
        setAvailableCohorts(relevant);
        // Sync selected cohorts with currently assigned ones from API response
        // This ensures we show what's actually in the database
        const currentlyAssigned = relevant
          .filter((c) => {
            const cohortProgramId = c.programId ?? c.program?.id ?? null;
            return cohortProgramId === programId;
          })
          .map((c) => c.id);
        // Use API-detected assignments (more reliable than prop)
        // But preserve user selections if they've made changes
        setSelectedCohortIds((prev) => {
          // If user hasn't made changes yet, use API data
          // Otherwise keep their selections
          const hasUserChanges = prev.length !== currentlyAssigned.length || 
            !prev.every(id => currentlyAssigned.includes(id));
          return hasUserChanges ? prev : currentlyAssigned;
        });
        setLoadingCohorts(false);
      })
      .catch((err) => {
        console.error("Failed to load cohorts:", err);
        setLoadingCohorts(false);
      });
  }, [programId]);

  // Update selected cohorts when prop changes (e.g., after page refresh)
  useEffect(() => {
    if (assignedCohortIds.length > 0 && selectedCohortIds.length === 0 && !loadingCohorts) {
      setSelectedCohortIds(assignedCohortIds);
    }
  }, [assignedCohortIds, loadingCohorts]);

  async function handleAssign() {
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      console.log("Assigning course to cohorts:", selectedCohortIds);
      const res = await fetch(`/api/programs/${programId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cohortIds: selectedCohortIds }),
      });
      const data = await res.json().catch(() => ({}));
      console.log("Assignment response:", res.status, data);
      if (!res.ok) {
        const errorMsg = typeof data.error === 'object' 
          ? JSON.stringify(data.error) 
          : data.error?.message || data.error || "Failed to assign course to cohorts";
        setError(errorMsg);
        setLoading(false);
        return;
      }
      // Success - show message and refresh
      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error("Assignment error:", err);
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (loadingCohorts) {
    return <p className="text-sm text-[#6b7280]">Loading cohorts...</p>;
  }

  return (
    <div className="space-y-4">
      {availableCohorts.length === 0 ? (
        <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] dark:bg-[#1f2937] p-4">
          <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mb-2">
            No cohorts available. Create cohorts first (without a program), then assign mentors and enroll trainees.
          </p>
          <Link
            href="/dashboard/admin/cohorts/new"
            className="text-sm font-medium"
            style={{ color: "var(--unipod-blue)" }}
          >
            Create cohort →
          </Link>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-2">
              Select cohorts to assign this course to:
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] p-3">
              {availableCohorts.map((cohort) => {
                const cohortProgramId = cohort.programId ?? cohort.program?.id ?? null;
                const isAssigned = cohortProgramId === programId;
                return (
                  <label
                    key={cohort.id}
                    className={`flex items-center gap-2 p-2 rounded hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#374151] cursor-pointer ${
                      isAssigned ? "bg-green-50 dark:bg-green-900/20" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCohortIds.includes(cohort.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCohortIds((prev) => {
                            if (!prev.includes(cohort.id)) {
                              return [...prev, cohort.id];
                            }
                            return prev;
                          });
                        } else {
                          setSelectedCohortIds((prev) => prev.filter((id) => id !== cohort.id));
                        }
                      }}
                      className="rounded border-[#e5e7eb] dark:border-[#374151] cursor-pointer"
                    />
                    <span className="text-sm text-[#171717] dark:text-[#f9fafb] flex items-center gap-2">
                      {cohort.name}
                      {isAssigned && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200">
                          Assigned
                        </span>
                      )}
                      {cohort.mentor && (
                        <span className="ml-auto text-xs text-[#6b7280] dark:text-[#9ca3af]">
                          Mentor: {cohort.mentor.name}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-[#6b7280] dark:text-[#9ca3af]">
              Check/uncheck cohorts to assign or unassign this course. Trainees enrolled in assigned cohorts will see this course in their "My learning" section.
            </p>
          </div>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-3">
              <p className="text-sm text-green-600 dark:text-green-400">
                ✓ Course assignment saved successfully! Refreshing...
              </p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAssign}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--unipod-blue)" }}
            >
              {loading ? "Saving…" : selectedCohortIds.length > 0 
                ? `Save assignment (${selectedCohortIds.length} cohort${selectedCohortIds.length !== 1 ? "s" : ""})`
                : "Unassign all cohorts"}
            </button>
            {selectedCohortIds.length === 0 && !loading && !success && (
              <span className="text-xs text-[#6b7280] dark:text-[#9ca3af]">
                No cohorts selected - will unassign all cohorts from this course
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
