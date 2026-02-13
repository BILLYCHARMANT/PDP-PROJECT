"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Program = {
  id: string;
  name: string;
};

export function ApproveCourseModal({
  courseId,
  courseName,
  currentProgramId,
  onClose,
  onSuccess,
}: {
  courseId: string;
  courseName: string;
  currentProgramId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>(currentProgramId || "");
  const [loading, setLoading] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [error, setError] = useState("");

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    // Fetch all programs
    fetch("/api/programs")
      .then((r) => r.json())
      .then((data) => {
        setPrograms(Array.isArray(data) ? data : []);
        setLoadingPrograms(false);
      })
      .catch(() => {
        setError("Failed to load programs");
        setLoadingPrograms(false);
      });
  }, []);

  async function handleApprove() {
    setError("");
    setLoading(true);
    try {
      // Approve course and optionally assign to program
      const res = await fetch(`/api/courses/${courseId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: selectedProgramId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to approve course");
        setLoading(false);
        return;
      }
      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
      onClose();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="rounded-2xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] shadow-xl w-full max-w-md overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] dark:border-[#374151]">
          <h2 className="text-xl font-bold text-[#171717] dark:text-[#f9fafb]">Approve Course</h2>
          <button
            onClick={onClose}
            className="text-[#6b7280] dark:text-[#9ca3af] hover:text-[#374151] dark:hover:text-[#f9fafb] p-1 rounded transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-hidden p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mb-4">
                Approve course <strong className="text-[#171717] dark:text-[#f9fafb]">{courseName}</strong> and optionally assign it to a program.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-2">
                Assign to Program <span className="text-[#6b7280]">(optional)</span>
              </label>
              {loadingPrograms ? (
                <div className="text-sm text-[#6b7280] dark:text-[#9ca3af]">Loading programs...</div>
              ) : (
                <select
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-sm text-[#171717] dark:text-[#f9fafb]"
                >
                  <option value="">No program (assign later)</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              )}
              {programs.length === 0 && !loadingPrograms && (
                <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-1">
                  No programs available. Create a program first.
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 px-4 py-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-medium border border-[#e5e7eb] dark:border-[#374151] text-[#374151] dark:text-[#d1d5db] hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#374151]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "var(--unipod-blue)" }}
              >
                {loading ? "Approving…" : "Approve Course"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
