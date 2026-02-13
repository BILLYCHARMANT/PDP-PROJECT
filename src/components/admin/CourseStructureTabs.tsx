"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreateModuleModal } from "./CreateModuleModal";
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
  const [createChapterOpen, setCreateChapterOpen] = useState(false);
  const [editChapterLesson, setEditChapterLesson] = useState<Lesson | null>(null);

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
                  <button
                    type="button"
                    onClick={() => setSelectedModule(m)}
                    className={`w-full text-left rounded-lg border px-4 py-3 flex items-center justify-between gap-4 transition-colors ${
                      selectedModule?.id === m.id
                        ? "border-[var(--unipod-blue)] bg-[var(--unipod-blue)]/10 dark:bg-[var(--unipod-blue)]/20"
                        : "border-[#e5e7eb] dark:border-[#374151] hover:bg-[#f9fafb] dark:hover:bg-[#111827]"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-[#171717] dark:text-[#f9fafb] block">{m.title}</span>
                      {m.description && (
                        <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-1 line-clamp-1">{m.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-[#6b7280] dark:text-[#9ca3af] shrink-0">
                      {m.lessons.length} chapter{m.lessons.length !== 1 ? "s" : ""}
                    </span>
                  </button>
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
