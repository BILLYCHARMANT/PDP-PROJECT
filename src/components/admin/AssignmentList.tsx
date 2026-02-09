"use client";
import Link from "next/link";

type Assignment = {
  id: string;
  title: string;
  order: number;
};

export function AssignmentList({
  programId,
  moduleId,
  assignments,
}: {
  programId: string;
  moduleId: string;
  assignments: Assignment[];
}) {
  if (assignments.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        No assignments yet. Add at least one so trainees can complete the module.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {assignments.map((a) => (
        <li
          key={a.id}
          className="rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-between"
        >
          <span className="font-medium text-slate-800">{a.title}</span>
          <Link
            href={`/dashboard/admin/programs/${programId}/modules/${moduleId}/assignments/${a.id}`}
            className="text-sm link-unipod"
          >
            Edit
          </Link>
        </li>
      ))}
    </ul>
  );
}
