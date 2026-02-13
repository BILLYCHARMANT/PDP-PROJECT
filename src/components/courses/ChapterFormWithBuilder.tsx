"use client";

import { useState, useEffect } from "react";
import { ChapterContentBuilder, type ContentBlock } from "./ChapterContentBuilder";

function parseContentBlocks(content: string | null | undefined): ContentBlock[] {
  if (!content || typeof content !== "string") return [];
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function ChapterFormWithBuilder({
  moduleId,
  lessonId,
  initial,
  onSuccess,
  onCancel,
}: {
  moduleId: string;
  lessonId?: string;
  initial?: {
    title?: string;
    content?: string | null;
    videoUrl?: string | null;
    resourceUrl?: string | null;
    order?: number;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const isEdit = !!lessonId;
  const [lessonTitle, setLessonTitle] = useState(initial?.title ?? "");
  const [lessonContentBlocks, setLessonContentBlocks] = useState<ContentBlock[]>(() =>
    parseContentBlocks(initial?.content)
  );
  const [lessonVideoUrl, setLessonVideoUrl] = useState(initial?.videoUrl ?? "");
  const [lessonOrder, setLessonOrder] = useState(initial?.order ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availableQuizzes, setAvailableQuizzes] = useState<Array<{ id: string; title: string }>>([]);
  const [availableAssignments, setAvailableAssignments] = useState<Array<{ id: string; title: string }>>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/modules/${moduleId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.assignments) {
          const list = data.assignments.map((a: { id: string; title: string }) => ({ id: a.id, title: a.title }));
          setAvailableQuizzes(list);
          setAvailableAssignments(list);
        }
        setAssignmentsLoading(false);
      })
      .catch(() => setAssignmentsLoading(false));
  }, [moduleId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lessonTitle.trim()) {
      setError("Chapter title is required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const blocks = [...lessonContentBlocks];
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (block.type === "quiz" && !(block as { quizId?: string }).quizId && (block as { title?: string }).title?.trim()) {
          try {
            const quizRes = await fetch("/api/assignments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                moduleId,
                title: (block as { title: string }).title.trim(),
                description: "Quiz from chapter content",
                order: 0,
              }),
            });
            const quizData = await quizRes.json().catch(() => ({}));
            if (quizRes.ok && quizData.id) {
              (blocks[i] as { quizId: string }).quizId = quizData.id;
            }
          } catch {
            // continue
          }
        } else if (block.type === "assignment" && !(block as { assignmentId?: string }).assignmentId && (block as { title?: string }).title?.trim()) {
          try {
            const assignRes = await fetch("/api/assignments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                moduleId,
                title: (block as { title: string }).title.trim(),
                description: (block as { content?: string }).content || "Assignment from chapter content",
                instructions: (block as { htmlContent?: string }).htmlContent || (block as { content?: string }).content || undefined,
                order: 0,
              }),
            });
            const assignData = await assignRes.json().catch(() => ({}));
            if (assignRes.ok && assignData.id) {
              (blocks[i] as { assignmentId: string }).assignmentId = assignData.id;
            }
          } catch {
            // continue
          }
        }
      }
      const contentJson = JSON.stringify(blocks);
      const url = lessonId ? `/api/lessons/${lessonId}` : "/api/lessons";
      const method = lessonId ? "PATCH" : "POST";
      const body = lessonId
        ? {
            title: lessonTitle.trim(),
            content: contentJson || undefined,
            videoUrl: lessonVideoUrl.trim() || undefined,
            order: lessonOrder,
          }
        : {
            moduleId,
            title: lessonTitle.trim(),
            content: contentJson || undefined,
            videoUrl: lessonVideoUrl.trim() || undefined,
            order: lessonOrder,
          };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error?.message || JSON.stringify(data.error) || (lessonId ? "Failed to update chapter" : "Failed to create chapter"));
        setLoading(false);
        return;
      }
      setLoading(false);
      onSuccess?.();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827] p-4 space-y-4">
        <h4 className="font-medium text-[#171717] dark:text-[#f9fafb]">{isEdit ? "Edit Chapter (Lesson)" : "Create Chapter (Lesson)"}</h4>

        <div>
          <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-2">Chapter Title *</label>
          <input
            type="text"
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-3 py-2 text-sm text-[#171717] dark:text-[#f9fafb]"
            placeholder="e.g. Getting Started"
            dir="ltr"
            style={{ direction: "ltr", textAlign: "left" }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-2">Chapter Content</label>
          <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mb-3">
            Build your chapter content by adding blocks. You can add titles, headers, paragraphs, quizzes, assignments, images, and links.
          </p>
          {assignmentsLoading ? (
            <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] py-2">Loading…</p>
          ) : (
            <ChapterContentBuilder
              content={lessonContentBlocks}
              onChange={setLessonContentBlocks}
              availableQuizzes={availableQuizzes}
              availableAssignments={availableAssignments}
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-2">Video URL (optional)</label>
          <input
            type="url"
            value={lessonVideoUrl}
            onChange={(e) => setLessonVideoUrl(e.target.value)}
            className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-3 py-2 text-sm text-[#171717] dark:text-[#f9fafb]"
            placeholder="https://..."
            dir="ltr"
            style={{ direction: "ltr", textAlign: "left" }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-2">Order</label>
          <input
            type="number"
            min={0}
            value={lessonOrder}
            onChange={(e) => setLessonOrder(Number(e.target.value))}
            className="w-24 rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-3 py-2 text-sm text-[#171717] dark:text-[#f9fafb]"
          />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border-2 border-[#e5e7eb] dark:border-[#374151] px-5 py-2.5 text-sm font-medium text-[#374151] dark:text-[#d1d5db] hover:bg-[#f9fafb] dark:hover:bg-[#111827]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--unipod-blue)" }}
          >
            {loading ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Update chapter" : "Create chapter"}
          </button>
        </div>
      </div>
    </form>
  );
}
