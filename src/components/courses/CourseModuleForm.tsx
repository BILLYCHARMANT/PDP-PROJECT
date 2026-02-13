"use client";
import { useState } from "react";

export function CourseModuleForm({
  courseId,
  onSuccess,
  onCancel,
}: {
  courseId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title,
          description: description.trim() || undefined,
          order,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error?.message || JSON.stringify(data.error) || "Failed to create module");
        setLoading(false);
        return;
      }
      setTitle("");
      setDescription("");
      setOrder(0);
      onSuccess();
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-[#e5e7eb] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1f2937]">
      <h3 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb]">Create New Module</h3>
      <div>
        <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Module Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-[#171717] dark:text-[#f9fafb]"
          placeholder="e.g. Module 1: Introduction"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-[#171717] dark:text-[#f9fafb]"
          placeholder="Brief description of what trainees will learn"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Order</label>
        <input
          type="number"
          min={0}
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-[#171717] dark:text-[#f9fafb]"
        />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium border border-[#e5e7eb] dark:border-[#374151] text-[#374151] dark:text-[#d1d5db]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--unipod-blue)" }}
        >
          {loading ? "Creating…" : "Create Module"}
        </button>
      </div>
    </form>
  );
}
