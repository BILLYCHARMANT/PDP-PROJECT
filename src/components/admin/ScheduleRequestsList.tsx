"use client";

import { useState } from "react";
import Link from "next/link";

type Request = {
  id: string;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  eventType: string;
  location: string;
  status: string;
  trainee: { id: string; name: string | null; email: string | null };
  mentor: { name: string | null } | null;
};

export function ScheduleRequestsList({
  requests: initialRequests,
}: {
  requests: Request[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const updateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/schedule-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const pending = requests.filter((r) => r.status === "PENDING");
  const approved = requests.filter((r) => r.status === "APPROVED");
  const rejected = requests.filter((r) => r.status === "REJECTED");

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const timeRange = (r: Request) =>
    [r.startTime, r.endTime].filter(Boolean).join(" – ") || "—";
  const typeLabel = (t: string) =>
    t === "LAB_WORKSHOP" ? "Lab access" : t === "COURSE_SCHEDULE" ? "Course schedule" : "Technical support";

  const Row = ({ r, showActions }: { r: Request; showActions: boolean }) => (
    <tr className="border-b border-slate-200 dark:border-slate-700">
      <td className="py-3 px-2 text-slate-800 dark:text-slate-200">
        {r.trainee.name || r.trainee.email || "—"}
      </td>
      <td className="py-3 px-2 text-slate-700 dark:text-slate-300">
        {typeLabel(r.eventType)}
      </td>
      <td className="py-3 px-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
        {formatDate(r.date)}
      </td>
      <td className="py-3 px-2 text-slate-700 dark:text-slate-300">
        {timeRange(r)}
      </td>
      <td className="py-3 px-2 text-slate-700 dark:text-slate-300">
        {r.location}
      </td>
      <td className="py-3 px-2 text-slate-700 dark:text-slate-300">
        {r.mentor?.name ?? "—"}
      </td>
      <td className="py-3 px-2">
        {showActions ? (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loadingId === r.id}
              onClick={() => updateStatus(r.id, "APPROVED")}
              className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={loadingId === r.id}
              onClick={() => updateStatus(r.id, "REJECTED")}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        ) : (
          <span
            className={
              r.status === "APPROVED"
                ? "text-green-600 dark:text-green-400"
                : r.status === "REJECTED"
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-600 dark:text-slate-400"
            }
          >
            {r.status}
          </span>
        )}
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Pending ({pending.length})
          </h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="py-2 px-2">Trainee</th>
                  <th className="py-2 px-2">Type</th>
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Time</th>
                  <th className="py-2 px-2">Location</th>
                  <th className="py-2 px-2">Mentor</th>
                  <th className="py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((r) => (
                  <Row key={r.id} r={r} showActions />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {(approved.length > 0 || rejected.length > 0) && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Processed
          </h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="py-2 px-2">Trainee</th>
                  <th className="py-2 px-2">Type</th>
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Time</th>
                  <th className="py-2 px-2">Location</th>
                  <th className="py-2 px-2">Mentor</th>
                  <th className="py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...approved, ...rejected].map((r) => (
                  <Row key={r.id} r={r} showActions={false} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {requests.length === 0 && (
        <p className="text-slate-600 dark:text-slate-400">
          No schedule requests yet. Trainees can request lab, workshop or mentor meetings from My Planning.
        </p>
      )}
    </div>
  );
}
