"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PlanningCalendar } from "@/components/trainee/PlanningCalendar";
import { PlanningScheduledTasksList, type ScheduleItem } from "@/components/trainee/PlanningScheduledTasksList";
import type { ScheduleItemType } from "@/components/trainee/PlanningScheduledTasksList";

export type ScheduleRequestForMentor = {
  id: string;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  eventType: string;
  location: string;
  status: string;
  requestCoffee: boolean;
  description: string | null;
  equipmentNeeded: string | null;
  teamMembers: string | null;
  trainee: { id: string; name: string | null; email: string | null };
  mentor: { name: string | null } | null;
  moduleTitle: string | null;
  lessonTitle: string | null;
};

const typeLabel = (t: string) =>
  t === "LAB_WORKSHOP"
    ? "Lab access"
    : t === "MENTOR_MEETING"
      ? "Technical support"
      : t === "COURSE_SCHEDULE"
        ? "Course schedule"
        : t;

const typeTagClass: Record<string, string> = {
  LAB_WORKSHOP: "bg-violet-500 text-white",
  MENTOR_MEETING: "bg-purple-600 text-white",
  COURSE_SCHEDULE: "bg-sky-600 text-white",
};

const statusTagClass: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700",
  APPROVED: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700",
  REJECTED: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700",
};

function DetailModal({ request, onClose }: { request: ScheduleRequestForMentor; onClose: () => void }) {
  const dateStr = new Date(request.date).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeRange = [request.startTime, request.endTime].filter(Boolean).join(" – ") || "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1f2937] rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#e5e7eb] dark:border-[#374151] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb]">Request details</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] dark:hover:bg-[#374151]"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${typeTagClass[request.eventType] ?? "bg-slate-500 text-white"}`}
            >
              {typeLabel(request.eventType)}
            </span>
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold border ${statusTagClass[request.status] ?? ""}`}>
              {request.status}
            </span>
          </div>
          <p className="font-semibold text-[#171717] dark:text-[#f9fafb]">
            {request.trainee.name || request.trainee.email || "Trainee"}
          </p>
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-[#6b7280]">Date</dt>
              <dd className="font-medium text-[#171717] dark:text-[#f9fafb]">{dateStr}</dd>
            </div>
            {timeRange !== "—" && (
              <div>
                <dt className="text-[#6b7280]">Time</dt>
                <dd className="font-medium text-[#171717] dark:text-[#f9fafb]">{timeRange}</dd>
              </div>
            )}
            <div>
              <dt className="text-[#6b7280]">Location</dt>
              <dd className="font-medium text-[#171717] dark:text-[#f9fafb]">{request.location}</dd>
            </div>
            {request.eventType === "COURSE_SCHEDULE" && (request.moduleTitle || request.lessonTitle) && (
              <div>
                <dt className="text-[#6b7280]">Chapter</dt>
                <dd className="font-medium text-[#171717] dark:text-[#f9fafb]">
                  {[request.moduleTitle, request.lessonTitle].filter(Boolean).join(" → ")}
                </dd>
              </div>
            )}
            {request.description && (
              <div>
                <dt className="text-[#6b7280]">Description</dt>
                <dd className="font-medium text-[#171717] dark:text-[#f9fafb] whitespace-pre-wrap">{request.description}</dd>
              </div>
            )}
          </dl>
          <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] pt-2">
            View only. Trainee requests are approved by admin for reception pass. Use this to prepare for sessions.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] px-4 py-2 text-sm font-medium text-[#374151] dark:text-[#d1d5db]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function MentorPlanningContent({
  requests,
  scheduleItems = [],
}: {
  requests: ScheduleRequestForMentor[];
  scheduleItems?: ScheduleItem[];
}) {
  const [selectedRequest, setSelectedRequest] = useState<ScheduleRequestForMentor | null>(null);
  const [selectedDateForList, setSelectedDateForList] = useState<string | null>(null);

  const pending = requests.filter((r) => r.status === "PENDING");
  const approved = requests.filter((r) => r.status === "APPROVED");
  const rejected = requests.filter((r) => r.status === "REJECTED");

  const scheduledDates = useMemo((): { date: string; label: string; type: ScheduleItemType }[] => {
    return requests.map((r) => {
      const d = new Date(r.date);
      const dateStr = d.toISOString().slice(0, 10);
      const label = `${r.trainee.name || r.trainee.email || "Trainee"} – ${typeLabel(r.eventType)}`;
      const type: ScheduleItemType =
        r.eventType === "LAB_WORKSHOP" ? "lab_workshop" : r.eventType === "COURSE_SCHEDULE" ? "course_schedule" : "mentor_meeting";
      return { date: dateStr, label, type };
    });
  }, [requests]);

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const timeRange = (r: ScheduleRequestForMentor) =>
    [r.startTime, r.endTime].filter(Boolean).join(" – ") || "—";

  const requestsOnSelectedDate = useMemo(() => {
    if (!selectedDateForList) return [];
    return requests.filter((r) => {
      const d = new Date(r.date);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return dateStr === selectedDateForList;
    });
  }, [requests, selectedDateForList]);

  const selectedDateFormatted = selectedDateForList
    ? new Date(selectedDateForList + "T12:00:00").toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
          <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] dark:text-[#9ca3af]">Pending</p>
            <p className="mt-1 text-xl font-bold text-[#171717] dark:text-[#f9fafb]">{pending.length}</p>
            <p className="mt-0.5 text-xs text-[#6b7280] dark:text-[#9ca3af]">Trainee requests (view only)</p>
          </div>
          <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] dark:text-[#9ca3af]">Approved</p>
            <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">{approved.length}</p>
            <p className="mt-0.5 text-xs text-[#6b7280] dark:text-[#9ca3af]">By admin (reception pass)</p>
          </div>
          <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] dark:text-[#9ca3af]">Rejected</p>
            <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">{rejected.length}</p>
            <p className="mt-0.5 text-xs text-[#6b7280] dark:text-[#9ca3af]">By admin</p>
          </div>
          <Link
            href="/dashboard/mentor/technical-support"
            className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-3 shadow-sm flex flex-col hover:border-[var(--unipod-blue)] dark:hover:border-[var(--unipod-blue)] transition-colors"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] dark:text-[#9ca3af]">
              Technical support
            </p>
            <p className="mt-0.5 text-xs text-[#6b7280] dark:text-[#9ca3af]">View all requests</p>
            <span className="mt-2 text-sm font-medium" style={{ color: "var(--unipod-blue)" }}>Open →</span>
          </Link>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,360px)] gap-3 overflow-hidden">
          <div className="min-h-0 flex flex-col gap-3 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0 items-stretch">
              <div className="min-h-0 flex flex-col">
                <PlanningCalendar
                  scheduledDates={scheduledDates}
                  cohortStart={null}
                  cohortEnd={null}
                  onDateClick={(dateStr) => setSelectedDateForList(dateStr)}
                />
              </div>
              <div className="min-h-0 overflow-auto flex flex-col">
                <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-3 shadow-sm h-full flex flex-col min-h-0">
                  <h3 className="text-sm font-semibold text-[#171717] dark:text-[#f9fafb] mb-2 flex-shrink-0">
                    Upcoming schedule
                  </h3>
                  {requests.length === 0 ? (
                    <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] flex-1">
                      No trainee requests yet. Requests from your cohorts appear here for viewing only (admin approves for reception pass).
                    </p>
                  ) : (
                    <ul className="space-y-2 flex-1 min-h-0 overflow-auto">
                      {requests.map((r) => (
                        <li key={r.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedRequest(r)}
                            className="w-full text-left rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827] p-3 hover:border-[#d1d5db] dark:hover:border-[#4b5563] transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span
                                className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase shrink-0 ${typeTagClass[r.eventType] ?? "bg-slate-500 text-white"}`}
                              >
                                {typeLabel(r.eventType)}
                              </span>
                              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold border shrink-0 ${statusTagClass[r.status] ?? ""}`}>
                                {r.status}
                              </span>
                            </div>
                            <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-2">
                              {formatDate(r.date)}
                              {timeRange(r) !== "—" ? ` · ${timeRange(r)}` : ""}
                            </p>
                            <p className="mt-1.5 font-semibold text-[#171717] dark:text-[#f9fafb] text-sm">
                              {r.trainee.name || r.trainee.email || "Trainee"} – {r.location}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-col min-h-0 overflow-hidden">
            <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-3 shadow-sm h-full flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-2 flex-shrink-0">
                <h3 className="text-sm font-semibold text-[#171717] dark:text-[#f9fafb]">
                  Your schedule (courses & assignments)
                </h3>
                <Link
                  href="/dashboard/mentor/programs"
                  className="text-xs font-medium shrink-0"
                  style={{ color: "var(--unipod-blue)" }}
                >
                  Set schedule →
                </Link>
              </div>
              <div className="flex-1 min-h-0 overflow-auto">
                {scheduleItems.length > 0 ? (
                  <PlanningScheduledTasksList items={scheduleItems} compact />
                ) : (
                  <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">
                    Set module and assignment dates in Course List (edit each course → module → assignment).
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedDateForList && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedDateForList(null)}
        >
          <div
            className="bg-white dark:bg-[#1f2937] rounded-xl shadow-lg max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#e5e7eb] dark:border-[#374151] flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb]">
                Requests on {selectedDateFormatted}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedDateForList(null)}
                className="p-2 rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] dark:hover:bg-[#374151]"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-3 overflow-y-auto flex-1 min-h-0">
              {requestsOnSelectedDate.length === 0 ? (
                <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] py-4 text-center">No requests on this date.</p>
              ) : (
                <ul className="space-y-2">
                  {requestsOnSelectedDate.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDateForList(null);
                          setSelectedRequest(r);
                        }}
                        className="w-full text-left rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827] p-3 hover:border-[#d1d5db] dark:hover:border-[#4b5563] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase shrink-0 ${typeTagClass[r.eventType] ?? "bg-slate-500 text-white"}`}
                          >
                            {typeLabel(r.eventType)}
                          </span>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold border shrink-0 ${statusTagClass[r.status] ?? ""}`}>
                            {r.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-1.5">{timeRange(r) !== "—" ? timeRange(r) : "—"}</p>
                        <p className="font-medium text-[#171717] dark:text-[#f9fafb] text-sm mt-0.5">
                          {r.trainee.name || r.trainee.email || "Trainee"}
                        </p>
                        <p className="text-xs text-[#9ca3af] dark:text-[#6b7280] mt-0.5">{r.location}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedRequest && (
        <DetailModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />
      )}
    </>
  );
}
