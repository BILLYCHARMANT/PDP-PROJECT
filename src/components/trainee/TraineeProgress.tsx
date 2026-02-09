"use client";
import { useEffect, useState } from "react";

type Progress = {
  programId: string;
  overallPercent: number;
  allCompleted: boolean;
  modules: {
    moduleId: string;
    title: string;
    status: string;
    percentComplete: number;
  }[];
};

export function TraineeProgress({ programId }: { programId: string }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  useEffect(() => {
    fetch(`/api/progress?programId=${programId}`)
      .then((r) => r.json())
      .then(setProgress)
      .catch(() => setProgress(null));
  }, [programId]);
  if (!progress) return null;
  return (
    <div
      className="rounded-xl border border-[#e5e7eb] p-6 border-l-4"
      style={{ borderLeftColor: "var(--unipod-blue)" }}
    >
      <h3 className="font-semibold text-[#171717]">Your progress</h3>
      <div className="mt-2 flex items-center gap-4">
        <div className="h-3 flex-1 max-w-xs rounded-full bg-[var(--sidebar-bg)]" style={{ backgroundColor: "var(--sidebar-bg)" }}>
          <div
            className="h-3 rounded-full transition-[width]"
            style={{ width: `${progress.overallPercent}%`, backgroundColor: "var(--unipod-blue)" }}
          />
        </div>
        <span className="text-sm font-medium text-[#374151]">
          {progress.overallPercent}%
        </span>
      </div>
      {progress.allCompleted && (
        <p className="mt-2 text-sm text-green-700">
          All modules completed. You can download your certificate from the Certificates page.
        </p>
      )}
      <ul className="mt-4 space-y-2">
        {progress.modules.map((m) => (
          <li key={m.moduleId} className="flex items-center gap-2 text-sm">
            <span
              className={`rounded px-2 py-0.5 ${
                m.status === "COMPLETED"
                  ? "bg-green-100 text-green-800"
                  : m.status === "PENDING_REVIEW"
                    ? "bg-[var(--unipod-yellow-bg)] text-amber-800"
                    : "bg-[var(--sidebar-bg)] text-[#374151]"
              }`}
              style={
                m.status === "PENDING_REVIEW"
                  ? { backgroundColor: "var(--unipod-yellow-bg)" }
                  : m.status !== "COMPLETED"
                    ? { backgroundColor: "var(--sidebar-bg)" }
                    : undefined
              }
            >
              {m.status}
            </span>
            {m.title} — {m.percentComplete}%
          </li>
        ))}
      </ul>
    </div>
  );
}
