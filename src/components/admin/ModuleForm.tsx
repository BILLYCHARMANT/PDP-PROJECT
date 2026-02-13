"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ModuleForm({
  programId,
  courseId,
  initial = {},
  moduleId,
  onSuccess,
}: {
  programId?: string; // Legacy support
  courseId?: string;
  initial?: {
    title?: string;
    description?: string;
    inspiringQuotes?: string | null;
    order?: number;
    startDate?: string | null;
    endDate?: string | null;
  };
  moduleId?: string;
  onSuccess?: () => void;
}) {
  // Use courseId if provided, otherwise fall back to programId (for backward compatibility)
  const effectiveCourseId = courseId || programId;
  const router = useRouter();
  const [title, setTitle] = useState(initial.title ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [inspiringQuotes, setInspiringQuotes] = useState(initial.inspiringQuotes ?? "");
  const [order, setOrder] = useState(initial.order ?? 0);
  const [startDate, setStartDate] = useState(
    initial.startDate ? initial.startDate.slice(0, 16) : ""
  );
  const [endDate, setEndDate] = useState(
    initial.endDate ? initial.endDate.slice(0, 16) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = moduleId
        ? `/api/modules/${moduleId}`
        : "/api/modules";
      const method = moduleId ? "PATCH" : "POST";
      const body = moduleId
        ? {
            title: title || undefined,
            description: description || undefined,
            inspiringQuotes: inspiringQuotes.trim() || undefined,
            order,
            startDate: startDate ? new Date(startDate).toISOString() : null,
            endDate: endDate ? new Date(endDate).toISOString() : null,
          }
        : {
            courseId: effectiveCourseId,
            title,
            description: description || undefined,
            inspiringQuotes: inspiringQuotes.trim() || undefined,
            order,
            startDate: startDate ? new Date(startDate).toISOString() : null,
            endDate: endDate ? new Date(endDate).toISOString() : null,
          };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error?.message || JSON.stringify(data.error) || "Failed");
        setLoading(false);
        return;
      }
      setLoading(false);
      if (onSuccess) {
        onSuccess();
        router.refresh();
        return;
      }
      if (!moduleId && data.id) {
        router.push(`/dashboard/admin/programs/${effectiveCourseId}/modules/${data.id}`);
      } else {
        router.push(`/dashboard/admin/programs/${effectiveCourseId}`);
      }
      router.refresh();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Welcome message / description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Shown to trainees when they open this module. Use it to welcome them and describe what they'll learn."
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Inspiring quotes (optional)</label>
        <textarea
          value={inspiringQuotes}
          onChange={(e) => setInspiringQuotes(e.target.value)}
          rows={4}
          placeholder="One quote per line. These are displayed on the module overview to motivate trainees."
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Module start (date & time)
        </label>
        <input
          type="datetime-local"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <p className="text-xs text-slate-500 mt-1">
          Modules have their own schedule, separate from assignments.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Module end (date & time)
        </label>
        <input
          type="datetime-local"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Order</label>
        <input
          type="number"
          min={0}
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg btn-unipod px-4 py-2 disabled:opacity-50"
      >
        {loading ? "Saving…" : moduleId ? "Update" : "Create"}
      </button>
    </form>
  );
}
