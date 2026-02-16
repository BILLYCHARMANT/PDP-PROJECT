"use client";

import { useEffect } from "react";
import { CohortForm } from "@/components/admin/CohortForm";

type Program = { id: string; name: string };
type Course = { id: string; name: string; programId: string | null };
type Mentor = { id: string; name: string; email: string };

export function CreateCohortModal({
  onClose,
  onSuccess,
  programs,
  allCourses,
  mentors,
  initialProgramId,
}: {
  onClose: () => void;
  onSuccess?: () => void;
  programs: Program[];
  allCourses: Course[];
  mentors: Mentor[];
  initialProgramId?: string | null;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="rounded-2xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] dark:border-[#374151]">
          <h2 className="text-xl font-bold text-[#171717] dark:text-[#f9fafb]">Create New Cohort</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6b7280] dark:text-[#9ca3af] hover:text-[#374151] dark:hover:text-[#f9fafb] p-1 rounded transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <CohortForm
            programs={programs}
            allCourses={allCourses}
            mentors={mentors}
            initial={initialProgramId ? { programId: initialProgramId } : {}}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
}
