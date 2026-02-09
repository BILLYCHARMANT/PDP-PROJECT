"use client";

import { useEffect, useState } from "react";

type Enrollment = {
  id: string;
  atRisk: boolean;
  lastReminderAt: string | null;
  trainee: { id: string; name: string; email: string };
  cohort: { program: { id: string; name: string } };
};

export function RemindersList() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = () => {
    fetch("/api/mentor/remind")
      .then((r) => r.json())
      .then((data) => {
        setEnrollments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const sendReminder = (enrollmentId: string) => {
    setSending(enrollmentId);
    fetch("/api/mentor/remind", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollmentId }),
    })
      .then((r) => r.json())
      .then(() => {
        setSending(null);
        load();
      })
      .catch(() => setSending(null));
  };

  const setAtRisk = (enrollmentId: string, atRisk: boolean) => {
    setToggling(enrollmentId);
    fetch(`/api/admin/enrollments/${enrollmentId}/at-risk`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ atRisk }),
    })
      .then((r) => r.json())
      .then(() => {
        setToggling(null);
        load();
      })
      .catch(() => setToggling(null));
  };

  if (loading) {
    return <p className="text-[#6b7280]">Loading…</p>;
  }

  if (enrollments.length === 0) {
    return (
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 text-center shadow-sm">
        <p className="text-[#6b7280]">
          No trainees to show. As a mentor you see enrollments from cohorts you lead; admins see only at-risk trainees here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {enrollments.map((e) => (
        <div
          key={e.id}
          className={`rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
            e.atRisk ? "border-amber-300 bg-amber-50/30" : "border-[#e5e7eb]"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-[#171717]">{e.trainee.name}</p>
              <p className="text-sm text-[#6b7280]">{e.trainee.email}</p>
              <p className="mt-1 text-sm text-[#6b7280]">
                Program: {e.cohort.program.name}
              </p>
              {e.lastReminderAt && (
                <p className="mt-1 text-xs text-[#6b7280]">
                  Last reminder: {new Date(e.lastReminderAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-[#374151]">
                <input
                  type="checkbox"
                  checked={e.atRisk}
                  disabled={toggling === e.id}
                  onChange={() => setAtRisk(e.id, !e.atRisk)}
                  className="rounded border-[#d1d5db]"
                />
                At risk
              </label>
              <button
                type="button"
                onClick={() => sendReminder(e.id)}
                disabled={sending === e.id}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                style={{ backgroundColor: "var(--unipod-blue)" }}
              >
                {sending === e.id ? "Sending…" : "Send reminder"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
