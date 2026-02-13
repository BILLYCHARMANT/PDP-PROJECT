"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
  modules: initialModules,
  onRefresh,
}: {
  programId: string;
  modules: Module[];
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const [modules, setModules] = useState(initialModules);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(moduleId: string, moduleTitle: string, lessonCount: number, assignmentCount: number) {
    const message = lessonCount > 0 || assignmentCount > 0
      ? `Delete module "${moduleTitle}"? This will also delete ${lessonCount} chapter(s) and ${assignmentCount} assignment(s). This action cannot be undone.`
      : `Delete module "${moduleTitle}"? This action cannot be undone.`;
    
    if (!confirm(message)) {
      return;
    }

    setDeletingId(moduleId);
    try {
      const res = await fetch(`/api/modules/${moduleId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete module");
        setDeletingId(null);
        return;
      }
      // Remove from local state
      setModules(modules.filter((m) => m.id !== moduleId));
      // Refresh if callback provided
      if (onRefresh) {
        onRefresh();
      } else {
        router.refresh();
      }
    } catch {
      alert("Network error");
      setDeletingId(null);
    }
  }

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
            <div className="flex items-start justify-between gap-2 mb-2">
              <Link
                href={`/dashboard/admin/programs/${programId}/modules/${m.id}`}
                className="font-semibold text-slate-800 hover:underline flex-1"
                style={{ color: "var(--unipod-blue)" }}
              >
                {m.title}
              </Link>
              <div className="flex gap-1">
                <button
                  onClick={() => router.push(`/dashboard/admin/programs/${programId}/modules/${m.id}`)}
                  className="p-1.5 text-slate-600 hover:text-[var(--unipod-blue)] transition-colors"
                  title="Edit module"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(m.id, m.title, m.lessons.length, m.assignments.length)}
                  disabled={deletingId === m.id}
                  className="p-1.5 text-slate-600 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete module"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            {m.description && (
              <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                {m.description}
              </p>
            )}
            <p className="text-xs text-slate-500">
              {m.lessons.length} chapter(s) · {m.assignments.length} assignment(s)
            </p>
          </div>
          <div className="mt-3 flex gap-2">
            <Link
              href={`/dashboard/admin/programs/${programId}/modules/${m.id}`}
              className="flex-1 inline-flex items-center justify-center rounded-lg border-2 py-2 text-sm font-medium"
              style={{
                borderColor: "var(--unipod-blue)",
                color: "var(--unipod-blue)",
              }}
            >
              Open module →
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
