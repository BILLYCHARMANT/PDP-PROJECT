"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteCourseButton({
  courseId,
  courseName,
  moduleCount,
}: {
  courseId: string;
  courseName: string;
  moduleCount: number;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const message = moduleCount > 0
      ? `Delete course "${courseName}"? This will also delete ${moduleCount} module(s) (including all lessons and assignments). This action cannot be undone.`
      : `Delete course "${courseName}"? This action cannot be undone.`;
    
    if (!confirm(message)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete course");
        setDeleting(false);
        return;
      }
      router.push("/dashboard/admin/programs");
      router.refresh();
    } catch {
      alert("Network error");
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 border border-red-300 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {deleting ? "Deleting…" : "Delete course"}
    </button>
  );
}
