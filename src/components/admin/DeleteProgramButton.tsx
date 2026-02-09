"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteProgramButton({
  programId,
  programName,
  cohortCount,
  moduleCount,
}: {
  programId: string;
  programName: string;
  cohortCount: number;
  moduleCount: number;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const message = cohortCount > 0 || moduleCount > 0
      ? `Delete course "${programName}"? This will also delete ${cohortCount} cohort(s) and ${moduleCount} module(s) (including all chapters and assignments). This action cannot be undone.`
      : `Delete course "${programName}"? This action cannot be undone.`;
    
    if (!confirm(message)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/programs/${programId}`, { method: "DELETE" });
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
