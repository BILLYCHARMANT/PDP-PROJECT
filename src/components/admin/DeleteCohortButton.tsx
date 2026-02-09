"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteCohortButton({
  cohortId,
  cohortName,
  enrollmentCount,
}: {
  cohortId: string;
  cohortName: string;
  enrollmentCount: number;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const message = enrollmentCount > 0
      ? `Delete cohort "${cohortName}"? This will also remove all ${enrollmentCount} trainee enrollment(s) in this cohort. This action cannot be undone.`
      : `Delete cohort "${cohortName}"? This action cannot be undone.`;
    
    if (!confirm(message)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/cohorts/${cohortId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete cohort");
        setDeleting(false);
        return;
      }
      router.push("/dashboard/admin/cohorts");
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
      {deleting ? "Deleting…" : "Delete cohort"}
    </button>
  );
}
