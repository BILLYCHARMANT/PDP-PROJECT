"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Course = {
  id: string;
  name: string;
  description: string | null;
  programId: string | null;
  program: { id: string; name: string } | null;
};

export function AssignCoursesToProgram({
  programId,
  assignedCourseIds,
  onSuccess,
}: {
  programId: string;
  assignedCourseIds: string[];
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(assignedCourseIds);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch all courses
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // Update each selected course to assign to this program
      const updatePromises = selectedCourseIds.map(async (courseId) => {
        const res = await fetch(`/api/courses/${courseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ programId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to assign course ${courseId}`);
        }
        return res.json();
      });

      // Unassign courses that were previously assigned but are no longer selected
      const coursesToUnassign = allCourses.filter(
        (c) => c.programId === programId && !selectedCourseIds.includes(c.id)
      );
      const unassignPromises = coursesToUnassign.map(async (course) => {
        const res = await fetch(`/api/courses/${course.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ programId: null }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to unassign course ${course.id}`);
        }
        return res.json();
      });

      await Promise.all([...updatePromises, ...unassignPromises]);
      setSuccess(true);
      setError("");
      router.refresh();
      // Call onSuccess callback if provided (for modal usage)
      onSuccess?.();
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to assign courses. Please try again.");
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="text-sm text-[#6b7280] dark:text-[#9ca3af]">Loading courses...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 px-4 py-3">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700 px-4 py-3">
          <p className="text-sm text-green-800 dark:text-green-200">Courses assigned successfully!</p>
        </div>
      )}

      <div className="space-y-2">
        {allCourses.length === 0 ? (
          <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">
            No courses available. Create a course first.
          </p>
        ) : (
          allCourses.map((course) => {
            const isSelected = selectedCourseIds.includes(course.id);
            const isAssignedToOther = course.programId && course.programId !== programId;
            return (
              <label
                key={course.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isSelected
                    ? "border-[var(--unipod-blue)] bg-[var(--unipod-blue-light)]/50 dark:bg-[#1f2937]"
                    : "border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] hover:border-[var(--unipod-blue)]/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCourseIds([...selectedCourseIds, course.id]);
                    } else {
                      setSelectedCourseIds(selectedCourseIds.filter((id) => id !== course.id));
                    }
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#171717] dark:text-[#f9fafb]">
                      {course.name}
                    </span>
                    {isAssignedToOther && (
                      <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                        Assigned to: {course.program?.name}
                      </span>
                    )}
                  </div>
                  {course.description && (
                    <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mt-1 line-clamp-2">
                      {course.description}
                    </p>
                  )}
                </div>
              </label>
            );
          })
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "var(--unipod-blue)" }}
        >
          {saving ? "Assigning..." : "Assign Course"}
        </button>
      </div>
    </form>
  );
}
