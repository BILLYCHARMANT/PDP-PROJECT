"use client";
import Link from "next/link";

type Lesson = {
  id: string;
  title: string;
  order: number;
};

export function LessonList({
  programId,
  moduleId,
  lessons,
}: {
  programId: string;
  moduleId: string;
  lessons: Lesson[];
}) {
  if (lessons.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        No chapters yet.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {lessons.map((l) => (
        <li
          key={l.id}
          className="rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-between"
        >
          <span className="font-medium text-slate-800">{l.title}</span>
          <Link
            href={`/dashboard/admin/programs/${programId}?moduleId=${moduleId}&editLessonId=${l.id}`}
            className="text-sm link-unipod"
          >
            Edit
          </Link>
        </li>
      ))}
    </ul>
  );
}
