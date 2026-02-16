"use client";

import { useState, useEffect } from "react";
import { CreateCourseWizard } from "@/components/courses/CreateCourseWizard";

export function CreateCourseModal({
  onClose,
  onSuccess,
  userRole,
  initialProgramId,
}: {
  onClose: () => void;
  onSuccess?: () => void;
  userRole: string;
  initialProgramId?: string | null;
}) {
  const [step, setStep] = useState(1);
  const [programId, setProgramId] = useState<string | null>(initialProgramId ?? null);
  const [courseId, setCourseId] = useState<string | null>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleStepChange = (newStep: number, newProgramId: string | null, newCourseId: string | null) => {
    setStep(newStep);
    if (newProgramId !== null) setProgramId(newProgramId);
    if (newCourseId !== null) setCourseId(newCourseId);
  };

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    // Reset state for next use
    setStep(1);
    setProgramId(null);
    setCourseId(null);
    onClose();
  };

  const handleClose = () => {
    // Reset state
    setStep(1);
    setProgramId(null);
    setCourseId(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={handleClose}
    >
      <div
        className="rounded-2xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] dark:border-[#374151]">
          <h2 className="text-xl font-bold text-[#171717] dark:text-[#f9fafb]">Create New Course</h2>
          <button
            onClick={handleClose}
            className="text-[#6b7280] dark:text-[#9ca3af] hover:text-[#374151] dark:hover:text-[#f9fafb] p-1 rounded transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <CreateCourseWizard
            key={`${step}-${courseId || 'new'}`}
            initialStep={step}
            initialProgramId={programId}
            initialCourseId={courseId}
            userRole={userRole}
            onStepChange={handleStepChange}
            onSuccess={handleSuccess}
            onClose={handleClose}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );
}
