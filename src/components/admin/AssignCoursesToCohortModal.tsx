"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Course = {
  id: string;
  name: string;
  description: string | null;
  programId: string | null;
  program?: { id: string; name: string } | null;
};

export function AssignCoursesToCohortModal({
  programId,
  programName,
  assignedCourseIds,
  onClose,
  onSuccess,
}: {
  programId: string | null;
  programName: string | null;
  assignedCourseIds: string[];
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => {
        setAllCourses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load courses");
        setLoading(false);
      });
  }, []);

  const assignableCourses = allCourses.filter((c) => !assignedCourseIds.includes(c.id));

  const toggleCourse = (courseId: string) => {
    setSelectedIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programId) return;
    setSaving(true);
    setError("");
    try {
      const results = await Promise.all(
        selectedIds.map((courseId) =>
          fetch(`/api/courses/${courseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ programId }),
          })
        )
      );
      const failed = results.some((r) => !r.ok);
      if (failed) {
        setError("Failed to assign one or more courses. Please try again.");
        setSaving(false);
        return;
      }
      router.refresh();
      onSuccess?.();
      onClose();
    } catch {
      setError("Failed to assign courses. Please try again.");
    }
    setSaving(false);
  };

  if (!programId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
        <div
          className="rounded-2xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-6 shadow-xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#171717] dark:text-[#f9fafb]">Assign courses</h2>
            <button type="button" onClick={onClose} className="text-[#6b7280] hover:text-[#374151] p-1 rounded" aria-label="Close">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">
            Assign a program to this cohort first (Edit cohort), then you can assign courses.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="rounded-2xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] dark:border-[#374151]">
          <h2 className="text-lg font-bold text-[#171717] dark:text-[#f9fafb]">Assign courses to cohort</h2>
          <button type="button" onClick={onClose} className="text-[#6b7280] hover:text-[#374151] dark:hover:text-[#f9fafb] p-1 rounded" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">
              Select courses to assign to this cohort (program: {programName}). Already assigned courses are not shown.
            </p>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
            )}
            {loading ? (
              <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">Loading courses…</p>
            ) : assignableCourses.length === 0 ? (
              <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">
                No other courses available. All courses are already assigned to this cohort.
              </p>
            ) : (
              <ul className="space-y-2">
                {assignableCourses.map((course) => (
                  <li key={course.id}>
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-[#e5e7eb] dark:border-[#374151] cursor-pointer hover:bg-[#f9fafb] dark:hover:bg-[#111827]">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(course.id)}
                        onChange={() => toggleCourse(course.id)}
                        className="mt-1 rounded border-[#e5e7eb] dark:border-[#374151]"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-[#171717] dark:text-[#f9fafb]">{course.name}</span>
                        {course.description && (
                          <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-0.5 line-clamp-2">{course.description}</p>
                        )}
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-3 px-6 py-4 border-t border-[#e5e7eb] dark:border-[#374151]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium border border-[#e5e7eb] dark:border-[#374151] text-[#374151] dark:text-[#d1d5db]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loading || assignableCourses.length === 0 || selectedIds.length === 0}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--unipod-blue)" }}
            >
              {saving ? "Assigning…" : `Assign ${selectedIds.length} course${selectedIds.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
