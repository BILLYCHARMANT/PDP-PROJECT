"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type OutlineModule = {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  lessons: { id: string; title: string; order: number }[];
  assignments: { id: string; title: string; order: number }[];
  unlocked?: boolean;
};

type Outline = {
  programName: string;
  programId: string;
  overallPercent: number;
  modules: OutlineModule[];
  accessedLessonIds: string[];
};

export function LearnCourseShell({
  outline,
  programId,
  children,
}: {
  outline: Outline;
  programId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const pathParts = pathname.split("/").filter(Boolean);
  const learnIndex = pathParts.indexOf("learn");
  const rest = learnIndex >= 0 ? pathParts.slice(learnIndex + 1) : [];
  // rest = [programId, moduleId?, lessonId | "assignment", assignmentId?]
  const currentModuleId = rest[1] ?? null;
  const isAssignmentPage = rest[2] === "assignment";
  const currentLessonId = !isAssignmentPage && rest[2] ? rest[2] : null;
  const currentAssignmentId = isAssignmentPage && rest[3] ? rest[3] : null;

  const currentModule = currentModuleId
    ? outline.modules.find((m) => m.id === currentModuleId)
    : null;

  function handleModuleChange(moduleId: string) {
    if (moduleId === currentModuleId) return;
    const mod = outline.modules.find((m) => m.id === moduleId);
    if (mod?.unlocked === false) return;
    router.push(`/dashboard/trainee/learn/${programId}/${moduleId}`);
  }

  return (
    <div className="flex min-h-0 flex-1 gap-0 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
      {/* Left: Module filter + chapters + assignments */}
      <aside
        className="w-72 flex-shrink-0 flex flex-col overflow-hidden border-r border-[#e5e7eb]"
        style={{ backgroundColor: "var(--sidebar-bg)" }}
      >
        <div className="flex-shrink-0 p-4">
          <Link
            href="/dashboard/trainee/learn"
            className="text-xs font-medium text-[#6b7280] dark:text-[#9ca3af] hover:text-[var(--unipod-blue)]"
          >
            ← All courses
          </Link>
          <p className="mt-1 text-sm font-semibold text-[#171717] dark:text-[#f9fafb]">{outline.programName}</p>
          <p className="mt-1 text-xs text-[#6b7280]">Average: {outline.overallPercent}%</p>

          {/* Module filter dropdown */}
          <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
            Module
          </label>
          <select
            value={currentModuleId ?? ""}
            onChange={(e) => handleModuleChange(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-3 py-2.5 text-sm font-medium text-[#171717] dark:text-[#f9fafb] focus:border-[var(--unipod-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--unipod-blue)] focus:ring-offset-0"
          >
            {outline.modules.map((m) => (
              <option
                key={m.id}
                value={m.id}
                disabled={m.unlocked === false}
                className="text-[#171717] dark:text-[#f9fafb]"
              >
                {m.title}
                {m.unlocked === false ? " (complete previous module first)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Chapters list for selected module */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {currentModule && (
            <nav className="flex flex-col gap-1">
              <ModuleChaptersList
                programId={programId}
                module={currentModule}
                accessedLessonIds={outline.accessedLessonIds}
                currentLessonId={currentLessonId}
                currentAssignmentId={currentAssignmentId}
              />
            </nav>
          )}
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}

function ModuleChaptersList({
  programId,
  module: mod,
  accessedLessonIds,
  currentLessonId,
  currentAssignmentId,
}: {
  programId: string;
  module: OutlineModule;
  accessedLessonIds: string[];
  currentLessonId: string | null;
  currentAssignmentId?: string | null;
}) {
  const accessedSet = new Set(accessedLessonIds);
  const lessonUnlocked = (index: number) =>
    index === 0 || accessedSet.has(mod.lessons[index - 1]!.id);
  const assignmentUnlocked =
    mod.lessons.length === 0 || mod.lessons.every((l) => accessedSet.has(l.id));

  return (
    <div className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] overflow-hidden">
      <div className="border-b border-[#e5e7eb] dark:border-[#374151] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9ca3af]">
        Chapters
      </div>
      <ul className="py-1">
        {mod.lessons.map((lesson, index) => {
          const completed = accessedSet.has(lesson.id);
          const isActive = currentLessonId === lesson.id;
          const unlocked = lessonUnlocked(index);
          const content = (
            <>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                {completed ? (
                  <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span
                    className="h-3 w-3 rounded-full border-2 border-[#d1d5db]"
                    style={isActive ? { borderColor: "var(--unipod-blue)" } : undefined}
                  />
                )}
              </span>
              <span className="min-w-0 truncate">{lesson.title}</span>
            </>
          );
          return (
            <li key={lesson.id}>
              {unlocked ? (
                <Link
                  href={`/dashboard/trainee/learn/${programId}/${mod.id}/${lesson.id}`}
                  className={`flex items-center gap-2 px-3 py-2 text-sm ${
                    isActive
                      ? "font-medium bg-[var(--unipod-blue-light)]"
                      : "hover:bg-[var(--sidebar-bg)]"
                  }`}
                  style={
                    isActive
                      ? { color: "var(--unipod-blue)", backgroundColor: "var(--unipod-blue-light)" }
                      : undefined
                  }
                >
                  {content}
                </Link>
              ) : (
                <span
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#9ca3af] cursor-not-allowed"
                  title="Complete the previous chapter first"
                >
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {mod.assignments.length > 0 && (
        <>
          <div className="border-t border-[#e5e7eb] dark:border-[#374151] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9ca3af]">
            Assignments
          </div>
          <ul className="py-1">
            {mod.assignments.map((a) => {
              const isActive = currentAssignmentId === a.id;
              if (assignmentUnlocked) {
                return (
                  <li key={a.id}>
                    <Link
                      href={`/dashboard/trainee/learn/${programId}/${mod.id}/assignment/${a.id}`}
                      className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--sidebar-bg)] ${isActive ? "font-medium bg-[var(--unipod-blue-light)]" : "text-[#6b7280] dark:text-[#9ca3af]"}`}
                      style={isActive ? { color: "var(--unipod-blue)", backgroundColor: "var(--unipod-blue-light)" } : undefined}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </span>
                      <span className="min-w-0 truncate">{a.title}</span>
                    </Link>
                  </li>
                );
              }
              return (
                <li key={a.id}>
                  <span
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#9ca3af] cursor-not-allowed"
                    title="Complete all chapters in this module first"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <span className="min-w-0 truncate">{a.title}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
