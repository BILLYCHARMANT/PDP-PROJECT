"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LessonForm({
  moduleId,
  programId,
  initial = {},
  lessonId,
  onSuccess,
  onCancel,
}: {
  moduleId: string;
  programId: string;
  initial?: {
    title?: string;
    content?: string;
    videoUrl?: string | null;
    resourceUrl?: string | null;
    order?: number;
  };
  lessonId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title ?? "");
  const [content, setContent] = useState(initial.content ?? "");
  const [videoUrl, setVideoUrl] = useState(initial.videoUrl ?? "");
  const [resourceUrl, setResourceUrl] = useState(initial.resourceUrl ?? "");
  const [order, setOrder] = useState(initial.order ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = lessonId ? `/api/lessons/${lessonId}` : "/api/lessons";
      const method = lessonId ? "PATCH" : "POST";
      const body = lessonId
        ? { title, content: content || undefined, videoUrl: videoUrl || undefined, resourceUrl: resourceUrl || undefined, order }
        : { moduleId, title, content: content || undefined, videoUrl: videoUrl || undefined, resourceUrl: resourceUrl || undefined, order };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(JSON.stringify(data.error) || "Failed");
        setLoading(false);
        return;
      }
      setLoading(false);
      if (onSuccess) {
        onSuccess();
        router.refresh();
        return;
      }
      router.push(`/dashboard/admin/programs/${programId}/modules/${moduleId}`);
      router.refresh();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
      <p className="rounded-lg border border-[var(--unipod-blue)] bg-[var(--unipod-blue-light)] px-4 py-2 text-sm text-[#374151]">
        This content appears as a <strong>chapter</strong> in the trainee&apos;s course. Add a title, main text, and optionally a video or resource link.
      </p>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b7280]">
          Chapter
        </h2>
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">
            Chapter title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Getting Set Up"
            className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 focus:border-[var(--unipod-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--unipod-blue)]"
          />
          <p className="mt-1 text-xs text-[#6b7280]">
            Shown in the course outline and as the main heading in the lesson view.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">
            Display order
          </label>
          <input
            type="number"
            min={0}
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="w-24 rounded-lg border border-[#e5e7eb] px-3 py-2 focus:border-[var(--unipod-blue)] focus:outline-none"
          />
          <p className="mt-1 text-xs text-[#6b7280]">
            Lower numbers appear first in the module.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b7280]">
          Main content
        </h2>
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">
            Content (text)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder="Write the lesson content here. Trainees see this in the main content area. You can use line breaks and simple formatting."
            className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 focus:border-[var(--unipod-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--unipod-blue)]"
          />
          <p className="mt-1 text-xs text-[#6b7280]">
            Optional. Use <code className="rounded bg-[#f3f4f6] px-1">---</code> on its own line to split content into steps (trainees see one step per page). Put an image URL on its own line to show it as an image card.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b7280]">
          Optional media &amp; resources
        </h2>
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">
            Video URL
          </label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/... or any video link"
            className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 focus:border-[var(--unipod-blue)] focus:outline-none"
          />
          <p className="mt-1 text-xs text-[#6b7280]">
            Optional. YouTube links are embedded; others open in a new tab. Leave empty if this chapter has no video.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">
            Resource or transcript link
          </label>
          <input
            type="text"
            value={resourceUrl}
            onChange={(e) => setResourceUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 focus:border-[var(--unipod-blue)] focus:outline-none"
          />
          <p className="mt-1 text-xs text-[#6b7280]">
            Optional. e.g. transcript, PDF, or external reading. Shown as &quot;Open resource&quot; to trainees.
          </p>
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--unipod-blue)" }}
        >
          {loading ? "Saving…" : lessonId ? "Update chapter" : "Create chapter"}
        </button>
        <button
          type="button"
          onClick={onCancel ?? (() => router.push(`/dashboard/admin/programs/${programId}/modules/${moduleId}`))}
          className="rounded-xl border-2 border-[#e5e7eb] px-5 py-2.5 text-sm font-medium text-[#374151] hover:bg-[var(--sidebar-bg)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
