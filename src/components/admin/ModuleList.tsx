"use client";
import Link from "next/link";

type Module = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: { id: string }[];
  assignments: { id: string }[];
};

export function ModuleList({
  programId,
  modules,
}: {
  programId: string;
  modules: Module[];
}) {
  if (modules.length === 0) {
    return (
      <p className="rounded-xl border border-[#e5e7eb] bg-white p-6 text-sm text-slate-600">
        No modules yet. Click &quot;Create module&quot; to add one; it will be assigned to all enrolled students.
      </p>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map((m) => (
        <li
          key={m.id}
          className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm flex flex-col"
        >
          <div className="flex-1">
            <Link
              href={`/dashboard/admin/programs/${programId}/modules/${m.id}`}
              className="font-semibold text-slate-800 hover:underline"
              style={{ color: "var(--unipod-blue)" }}
            >
              {m.title}
            </Link>
            <p className="text-xs text-slate-500 mt-2">
              {m.lessons.length} chapter(s) · {m.assignments.length} assignment(s)
            </p>
          </div>
          <Link
            href={`/dashboard/admin/programs/${programId}/modules/${m.id}`}
            className="mt-3 inline-flex items-center justify-center rounded-lg border-2 py-2 text-sm font-medium"
            style={{
              borderColor: "var(--unipod-blue)",
              color: "var(--unipod-blue)",
            }}
          >
            Open module →
          </Link>
        </li>
      ))}
    </ul>
  );
}
