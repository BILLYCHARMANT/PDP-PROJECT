"use client";
import { useEffect, useState } from "react";

type Analytics = {
  programs: { id: string; name: string }[];
  cohorts: unknown[];
  totalTrainees: number;
  completionRate: number;
  certificatesIssued: number;
  moduleStats: { moduleId: string; completed: number; total: number; avgProgress: number }[];
};

export function AnalyticsView() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <p className="text-slate-600">Loading…</p>;
  if (!data) return <p className="text-slate-600">Failed to load analytics.</p>;
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-medium text-slate-500">Total trainees</h3>
        <p className="mt-2 text-2xl font-semibold text-slate-800">
          {data.totalTrainees}
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-medium text-slate-500">Completion rate</h3>
        <p className="mt-2 text-2xl font-semibold text-slate-800">
          {data.completionRate}%
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-medium text-slate-500">Certificates issued</h3>
        <p className="mt-2 text-2xl font-semibold text-slate-800">
          {data.certificatesIssued}
        </p>
      </div>
      {data.moduleStats.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
          <h3 className="text-sm font-medium text-slate-500 mb-4">
            Module progress
          </h3>
          <ul className="space-y-2">
            {data.moduleStats.map((m, i) => (
              <li
                key={m.moduleId}
                className="flex items-center justify-between text-sm"
              >
                <span>Module {i + 1}</span>
                <span>
                  {m.completed}/{m.total} completed · avg {m.avgProgress}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
