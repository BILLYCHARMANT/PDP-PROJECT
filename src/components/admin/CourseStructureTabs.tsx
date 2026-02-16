"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreateModuleModal } from "./CreateModuleModal";
import { EditModuleModal } from "./EditModuleModal";
import { CreateChapterModal } from "./CreateChapterModal";
import { EditChapterModal } from "./EditChapterModal";

type Lesson = { id: string; title: string; order: number };
type Module = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: Lesson[];
  assignments: { id: string }[];
};

export function CourseStructureTabs({
  courseId,
  modules,
}: {
  courseId: string;
  courseName: string;
  modules: Module[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [createModuleOpen, setCreateModuleOpen] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null);
  const [createChapterOpen, setCreateChapterOpen] = useState(false);
  const [editChapterLesson, setEditChapterLesson] = useState<Lesson | null>(null);

  async function handleDeleteModule(m: Module) {
    const message =
      m.lessons.length > 0 || m.assignments.length > 0
        ? `Delete module "${m.title}"? This will also delete ${m.lessons.length} chapter(s) and ${m.assignments.length} assignment(s). This action cannot be undone.`
        : `Delete module "${m.title}"? This action cannot be undone.`;
    if (!confirm(message)) return;
    setDeletingModuleId(m.id);
    try {
      const res = await fetch(`/api/modules/${m.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error?.message || data.error || "Failed to delete module");
        setDeletingModuleId(null);
        return;
      }
      if (selectedModule?.id === m.id) setSelectedModule(null);
      setDeletingModuleId(null);
      router.refresh();
    } catch {
      alert("Network error");
      setDeletingModuleId(null);
    }
  }

  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  useEffect(() => {
    const moduleId = searchParams.get("moduleId");
    const createChapter = searchParams.get("createChapter");
    const editLessonId = searchParams.get("editLessonId");
    if (moduleId && createChapter === "1") {
      const mod = modules.find((m) => m.id === moduleId);
      if (mod) {
        setSelectedModule(mod);
        setCreateChapterOpen(true);
      }
    } else if (moduleId && editLessonId) {
      const mod = modules.find((m) => m.id === moduleId);
      const lesson = mod?.lessons.find((l) => l.id === editLessonId);
      if (mod && lesson) {
        setSelectedModule(mod);
        setEditChapterLesson(lesson);
      }
    }
  }, [searchParams, modules]);
  const sortedChapters = selectedModule
    ? [...selectedModule.lessons].sort((a, b) => a.order - b.order)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Section 1: Modules List */}
      <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] overflow-hidden shadow-sm">
        <div className="border-b border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827] px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb]">Modules</h2>
              <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-1">
                {modules.length} module{modules.length !== 1 ? "s" : ""} in this course
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateModuleOpen(true)}
              className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--unipod-blue)" }}
            >
              Create module
            </button>
          </div>
        </div>
        <div className="p-6 min-h-[300px]">
          {sortedModules.length === 0 ? (
            <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] text-center py-8">
              No modules in this course yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {sortedModules.map((m) => (
                <li key={m.id}>
                  <div
                    className={`rounded-lg border px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                      selectedModule?.id === m.id
                        ? "border-[var(--unipod-blue)] bg-[var(--unipod-blue)]/10 dark:bg-[var(--unipod-blue)]/20"
                        : "border-[#e5e7eb] dark:border-[#374151]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedModule(m)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <span className="font-medium text-[#171717] dark:text-[#f9fafb] block">{m.title}</span>
                      {m.description && (
                        <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-1 line-clamp-1">{m.description}</p>
                      )}
                    </button>
                    <span className="text-xs text-[#6b7280] dark:text-[#9ca3af] shrink-0">
                      {m.lessons.length} chapter{m.lessons.length !== 1 ? "s" : ""}
                    </span>
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setEditingModuleId(m.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-[#6b7280] dark:text-[#9ca3af] hover:text-[var(--unipod-blue)] hover:bg-[#f3f4f6] dark:hover:bg-[#374151] transition-colors"
                        title="Edit module"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteModule(m)}
                        disabled={deletingModuleId === m.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-[#6b7280] dark:text-[#9ca3af] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete module"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Section 2: Chapters List */}
      <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] overflow-hidden shadow-sm">
        <div className="border-b border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827] px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb]">Chapters</h2>
              <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-1">
                {selectedModule
                  ? `${sortedChapters.length} chapter${sortedChapters.length !== 1 ? "s" : ""} in "${selectedModule.title}"`
                  : "Select a module to view chapters"}
              </p>
            </div>
            {selectedModule ? (
              <button
                type="button"
                onClick={() => setCreateChapterOpen(true)}
                className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "var(--unipod-blue)" }}
              >
                Create chapter
              </button>
            ) : (
              <span className="text-xs text-[#9ca3af] dark:text-[#6b7280] shrink-0">
                Select a module to add chapters
              </span>
            )}
          </div>
        </div>
        <div className="p-6 min-h-[300px]">
          {!selectedModule ? (
            <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] text-center py-8">
              Click a module on the left to view its chapters here.
            </p>
          ) : sortedChapters.length === 0 ? (
            <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] text-center py-8">
              No chapters in this module yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {sortedChapters.map((lesson, index) => (
                <li
                  key={lesson.id}
                  className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] px-4 py-3 flex items-center justify-between gap-4 bg-[#f9fafb] dark:bg-[#111827]"
                >
                  <span className="text-sm font-medium text-[#171717] dark:text-[#f9fafb]">
                    {index + 1}. {lesson.title}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditChapterLesson(lesson);
                    }}
                    className="text-sm font-medium shrink-0 hover:underline"
                    style={{ color: "var(--unipod-blue)" }}
                  >
                    Edit
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {createModuleOpen && (
        <CreateModuleModal
          courseId={courseId}
          onClose={() => setCreateModuleOpen(false)}
          onSuccess={() => router.refresh()}
        />
      )}
      {editingModuleId && (
        <EditModuleModal
          courseId={courseId}
          moduleId={editingModuleId}
          onClose={() => setEditingModuleId(null)}
          onSuccess={() => router.refresh()}
        />
      )}
      {createChapterOpen && selectedModule && (
        <CreateChapterModal
          courseId={courseId}
          moduleId={selectedModule.id}
          onClose={() => setCreateChapterOpen(false)}
          onSuccess={() => router.refresh()}
        />
      )}
      {editChapterLesson && selectedModule && (
        <EditChapterModal
          lessonId={editChapterLesson.id}
          moduleId={selectedModule.id}
          onClose={() => setEditChapterLesson(null)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
