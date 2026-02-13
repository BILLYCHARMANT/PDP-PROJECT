"use client";
import { useState } from "react";

type User = { id: string; name: string; email: string };

export function EnrollTrainees({
  cohortId,
  enrolled,
  trainees,
  onSuccess,
}: {
  cohortId: string;
  enrolled: User[];
  trainees: User[];
  onSuccess?: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const enrolledIds = new Set(enrolled.map((u) => u.id));
  const available = trainees.filter((t) => !enrolledIds.has(t.id));

  async function handleEnroll() {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cohorts/${cohortId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traineeIds: selected }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSelected([]);
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.reload();
        }
      } else {
        alert(data.error || "Failed to enroll");
      }
    } catch {
      alert("Network error");
    }
    setLoading(false);
  }

  if (available.length === 0) {
    return (
      <p className="text-sm text-[#64748b]">
        All trainees are already enrolled or there are no trainees. Create
        trainee users first in <a href="/dashboard/admin/users" className="font-medium underline" style={{ color: "var(--unipod-blue)" }}>Users</a>.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <select
        multiple
        value={selected}
        onChange={(e) => {
          const opts = Array.from(e.target.selectedOptions, (o) => o.value);
          setSelected(opts);
        }}
        className="w-full max-w-md rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm"
        size={5}
      >
        {available.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} ({t.email})
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleEnroll}
        disabled={loading || selected.length === 0}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: "var(--unipod-blue, #2563eb)" }}
      >
        {loading ? "Enrolling…" : `Enroll selected (${selected.length})`}
      </button>
    </div>
  );
}
