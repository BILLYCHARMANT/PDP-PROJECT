"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Course = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  duration: string | null;
  modules: { id: string; title: string; order: number }[];
};

export function CoursesList({
  programId,
  courses: initialCourses,
}: {
  programId: string;
  courses: Course[];
}) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Reload courses when programId changes
    setLoading(true);
    fetch(`/api/courses?programId=${programId}`)
      .then((r) => r.json())
      .then((data) => {
        setCourses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [programId]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl bg-white shadow-sm border border-[#e5e7eb] overflow-hidden animate-pulse"
          >
            <div className="h-32 bg-[var(--sidebar-bg)]" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-[var(--sidebar-bg)] rounded w-3/4" />
              <div className="h-3 bg-[var(--sidebar-bg)] rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-[#fafafa] dark:bg-[#1f2937] p-8 text-center">
        <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mb-4">
          No courses yet. Create your first course for this program.
        </p>
        <Link
          href={`/dashboard/courses/new?programId=${programId}`}
          className="inline-block rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "var(--unipod-blue)" }}
        >
          Create Course
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Link
          key={course.id}
          href={`/dashboard/admin/programs/${programId}/courses/${course.id}`}
          className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-5 shadow-sm hover:shadow transition-shadow block"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-[#171717] dark:text-[#f9fafb] text-lg">
              {course.name}
            </h3>
          </div>
          {course.description && (
            <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mb-3 line-clamp-2">
              {course.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-[#6b7280] dark:text-[#9ca3af]">
            <span>{course.modules.length} module(s)</span>
            {course.duration && <span>• {course.duration}</span>}
          </div>
        </Link>
      ))}
    </div>
  );
}
