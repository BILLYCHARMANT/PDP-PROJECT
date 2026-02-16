"use client";

import { useState, useMemo } from "react";
import { PlanningCalendar } from "@/components/trainee/PlanningCalendar";
import { PlanningScheduledTasksList, type ScheduleItem } from "@/components/trainee/PlanningScheduledTasksList";
import type { ScheduleItemType } from "@/components/trainee/PlanningScheduledTasksList";

export type ScheduleRequestForAdmin = {
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

function SummaryModal({
  request,
  onClose,
  onApprove,
  onReject,
  loading,
}: {
  request: ScheduleRequestForAdmin;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  const dateStr = new Date(request.date).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeRange = [request.startTime, request.endTime]
    .filter(Boolean)
    .join(" – ") || "—";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1f2937] rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#e5e7eb] dark:border-[#374151] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb]">
            Request summary
          </h2>
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
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold border ${statusTagClass[request.status] ?? ""}`}
            >
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
            {request.mentor?.name && (
              <div>
                <dt className="text-[#6b7280]">Mentor</dt>
                <dd className="font-medium text-[#171717] dark:text-[#f9fafb]">{request.mentor.name}</dd>
              </div>
            )}
            {request.eventType === "COURSE_SCHEDULE" && (request.moduleTitle || request.lessonTitle) && (
              <div>
                <dt className="text-[#6b7280]">Chapter to attend</dt>
                <dd className="font-medium text-[#171717] dark:text-[#f9fafb]">
                  {[request.moduleTitle, request.lessonTitle].filter(Boolean).join(" → ")}
                </dd>
              </div>
            )}
            {request.requestCoffee && (
              <div>
                <dt className="text-[#6b7280]">Coffee</dt>
                <dd className="font-medium text-[#171717] dark:text-[#f9fafb]">Requested</dd>
              </div>
            )}
            {request.teamMembers && (
              <div>
                <dt className="text-[#6b7280]">Team members</dt>
                <dd className="font-medium text-[#171717] dark:text-[#f9fafb] whitespace-pre-wrap">{request.teamMembers}</dd>
              </div>
            )}
            {request.equipmentNeeded && (
              <div>
                <dt className="text-[#6b7280]">Equipment needed</dt>
                <dd className="font-medium text-[#171717] dark:text-[#f9fafb] whitespace-pre-wrap">{request.equipmentNeeded}</dd>
              </div>
            )}
            {request.description && (
              <div>
                <dt className="text-[#6b7280]">Description</dt>
                <dd className="font-medium text-[#171717] dark:text-[#f9fafb] whitespace-pre-wrap">{request.description}</dd>
              </div>
            )}
          </dl>
          {request.status === "PENDING" && (
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  onApprove();
                  onClose();
                }}
                className="flex-1 rounded-lg bg-green-600 text-white py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  onReject();
                  onClose();
                }}
                className="flex-1 rounded-lg bg-red-600 text-white py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}
          {request.status !== "PENDING" && (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] px-4 py-2 text-sm font-medium text-[#374151] dark:text-[#d1d5db]"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminScheduleApprovalsContent({
  requests: initialRequests,
  scheduleItems = [],
}: {
  requests: ScheduleRequestForAdmin[];
  scheduleItems?: ScheduleItem[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ScheduleRequestForAdmin | null>(null);
  const [selectedDateForList, setSelectedDateForList] = useState<string | null>(null);
  const [selectedAssignmentForList, setSelectedAssignmentForList] = useState<ScheduleItem | null>(null);
  const [selectedCourseForList, setSelectedCourseForList] = useState<ScheduleItem | null>(null);
  const [filterTraineeId, setFilterTraineeId] = useState<string>("");
  const [downloadDate, setDownloadDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

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
      setSelectedRequest((prev) => (prev?.id === id ? { ...prev, status } : prev));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const filteredRequests = useMemo(() => {
    if (!filterTraineeId) return requests;
    return requests.filter((r) => r.trainee.id === filterTraineeId);
  }, [requests, filterTraineeId]);

  const uniqueTrainees = useMemo(() => {
    const seen = new Set<string>();
    return requests
      .filter((r) => {
        if (seen.has(r.trainee.id)) return false;
        seen.add(r.trainee.id);
        return true;
      })
      .map((r) => ({ id: r.trainee.id, name: r.trainee.name || r.trainee.email || "Trainee" }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [requests]);

  const pending = requests.filter((r) => r.status === "PENDING");
  const approved = requests.filter((r) => r.status === "APPROVED");
  const rejected = requests.filter((r) => r.status === "REJECTED");

  const scheduledDates = useMemo((): { date: string; label: string; type: ScheduleItemType }[] => {
    return requests.map((r) => {
      const d = new Date(r.date);
      const dateStr = d.toISOString().slice(0, 10);
      const label = `${r.trainee.name || r.trainee.email || "Trainee"} – ${typeLabel(r.eventType)}`;
      const type: ScheduleItemType = r.eventType === "LAB_WORKSHOP" ? "lab_workshop" : "mentor_meeting";
      return { date: dateStr, label, type };
    });
  }, [requests]);

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const timeRange = (r: ScheduleRequestForAdmin) =>
    [r.startTime, r.endTime].filter(Boolean).join(" – ") || "—";

  const getRequestsForDate = (dateStr: string) =>
    requests.filter((r) => {
      const d = new Date(r.date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}` === dateStr;
    });

  const openPrintViewForReception = (dateStr: string, list: ScheduleRequestForAdmin[]) => {
    const approvedOnly = list.filter((r) => r.status === "APPROVED");
    const dateFormatted = new Date(dateStr + "T12:00:00").toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const rows = approvedOnly
      .map(
        (r) =>
          `<tr><td>${(r.trainee.name || r.trainee.email || "—").replace(/</g, "&lt;")}</td><td>${typeLabel(r.eventType)}</td><td>${[r.startTime, r.endTime].filter(Boolean).join(" – ") || "—"}</td><td>${(r.location || "").replace(/</g, "&lt;")}</td><td>${(r.mentor?.name || "—").replace(/</g, "&lt;")}</td></tr>`
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reception list – ${dateFormatted}</title><style>body{font-family:system-ui,sans-serif;padding:1.5rem;max-width:900px;margin:0 auto}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:0.5rem 0.75rem;text-align:left}th{background:#f5f5f5}h1{font-size:1.25rem;margin-bottom:0.5rem}.date{color:#666;margin-bottom:1rem}@media print{body{padding:0}}</style></head><body><h1>Schedule list for reception</h1><p class="date">${dateFormatted}</p><p style="font-size:0.875rem;color:#333;margin-bottom:0.75rem">Approved trainees only. Use at reception to verify access.</p><table><thead><tr><th>Trainee</th><th>Type</th><th>Time</th><th>Location</th><th>Mentor</th></tr></thead><tbody>${rows || "<tr><td colspan=\"5\">No approved requests on this date.</td></tr>"}</tbody></table><p style="margin-top:1rem;font-size:0.875rem;color:#666">Print or save as PDF for reception.</p><script>window.onload=function(){window.print()}</script></body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  const requestsOnSelectedDate = useMemo(() => {
    if (!selectedDateForList) return [];
    return requests.filter((r) => {
      const d = new Date(r.date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${day}`;
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
        {/* Top row: same 4-card layout as trainee */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
          <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] dark:text-[#9ca3af]">Pending</p>
            <p className="mt-1 text-xl font-bold text-[#171717] dark:text-[#f9fafb]">{pending.length}</p>
            <p className="mt-0.5 text-xs text-[#6b7280] dark:text-[#9ca3af]">Awaiting approval</p>
          </div>
          <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] dark:text-[#9ca3af]">Approved</p>
            <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">{approved.length}</p>
            <p className="mt-0.5 text-xs text-[#6b7280] dark:text-[#9ca3af]">Reception pass</p>
          </div>
          <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] dark:text-[#9ca3af]">Rejected</p>
            <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">{rejected.length}</p>
            <p className="mt-0.5 text-xs text-[#6b7280] dark:text-[#9ca3af]">Not approved</p>
          </div>
          <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-3 shadow-sm flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] dark:text-[#9ca3af]">
              Download for reception
            </p>
            <p className="mt-0.5 text-xs text-[#6b7280] dark:text-[#9ca3af]">
              List for a chosen day
            </p>
            <div className="mt-2 flex flex-col gap-2 flex-1 min-h-0">
              <input
                type="date"
                value={downloadDate}
                onChange={(e) => setDownloadDate(e.target.value)}
                className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827] px-2 py-1.5 text-sm text-[#171717] dark:text-[#f9fafb]"
              />
              <button
                type="button"
                onClick={() => openPrintViewForReception(downloadDate, getRequestsForDate(downloadDate))}
                className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#d1d5db] dark:border-[#4b5563] bg-[#f9fafb] dark:bg-[#111827] py-2 px-3 text-sm font-medium text-[#374151] dark:text-[#d1d5db] hover:border-[var(--unipod-blue)] hover:bg-[var(--unipod-blue-light)] dark:hover:bg-[#1e3a5f] transition-colors"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download / Print list
              </button>
            </div>
          </div>
        </div>

        {/* Same grid as trainee: left (calendar + upcoming) + right (scheduled tasks list with filter) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,360px)] gap-3 overflow-hidden">
          <div className="min-h-0 flex flex-col gap-3 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0 items-stretch">
              {/* Calendar: all request dates */}
              <div className="min-h-0 flex flex-col">
                <PlanningCalendar
                  scheduledDates={scheduledDates}
                  cohortStart={null}
                  cohortEnd={null}
                  onDateClick={(dateStr) => setSelectedDateForList(dateStr)}
                />
              </div>
              {/* Upcoming schedule panel = request cards (approve/reject) */}
              <div className="min-h-0 overflow-auto flex flex-col">
                <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-3 shadow-sm h-full flex flex-col min-h-0">
                  <h3 className="text-sm font-semibold text-[#171717] dark:text-[#f9fafb] mb-2 flex-shrink-0">
                    Upcoming schedule
                  </h3>
                  {filteredRequests.length === 0 ? (
                    <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] flex-1">
                      No schedule requests to show. Use the filter or wait for trainee requests.
                    </p>
                  ) : (
                    <ul className="space-y-2 flex-1 min-h-0 overflow-auto">
                      {filteredRequests.map((r) => (
                        <li key={r.id}>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedRequest(r)}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedRequest(r); } }}
                            className="w-full text-left rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827] p-3 hover:border-[#d1d5db] dark:hover:border-[#4b5563] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span
                                className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase shrink-0 ${typeTagClass[r.eventType] ?? "bg-slate-500 text-white"}`}
                              >
                                {typeLabel(r.eventType)}
                              </span>
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold border shrink-0 ${statusTagClass[r.status] ?? ""}`}
                              >
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
                            {r.status === "PENDING" && (
                              <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  disabled={loadingId === r.id}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    updateStatus(r.id, "APPROVED");
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={loadingId === r.id}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    updateStatus(r.id, "REJECTED");
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            {/* Bottom left: same two cards as trainee (placeholder for consistency) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-shrink-0">
              <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] dark:text-[#9ca3af] mb-2">Overview</p>
                <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">All trainee schedule requests in one place. Approve for reception pass.</p>
              </div>
              <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] dark:text-[#9ca3af] mb-2">Actions</p>
                <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">Click a request to view details, then Approve or Reject.</p>
              </div>
            </div>
          </div>

          {/* Right panel: Scheduled tasks only (course / module / assignment cards) — no schedule requests here */}
          <div className="hidden lg:flex flex-col min-h-0 overflow-hidden">
            <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-3 shadow-sm h-full flex flex-col min-h-0 overflow-hidden">
              <h3 className="text-sm font-semibold text-[#171717] dark:text-[#f9fafb] mb-2 flex-shrink-0">
                Scheduled tasks
              </h3>
              <div className="flex-1 min-h-0 overflow-auto">
                {scheduleItems.length > 0 ? (
                  <PlanningScheduledTasksList
                    items={scheduleItems}
                    compact
                    onAssignmentCardClick={setSelectedAssignmentForList}
                    onCourseCardClick={setSelectedCourseForList}
                  />
                ) : (
                  <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">
                    No course, module or assignment schedules set yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popup: list of requests for the clicked date */}
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
              <div className="flex flex-col sm:flex-row gap-2 mb-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => selectedDateForList && openPrintViewForReception(selectedDateForList, requestsOnSelectedDate)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[var(--unipod-blue)] text-white py-2 px-3 text-sm font-medium hover:opacity-90"
                >
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download / Print list for reception
                </button>
              </div>
              {requestsOnSelectedDate.length === 0 ? (
                <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] py-4 text-center">
                  No schedule requests on this date.
                </p>
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
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold border shrink-0 ${statusTagClass[r.status] ?? ""}`}
                          >
                            {r.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-1.5">
                          {timeRange(r) !== "—" ? timeRange(r) : "—"}
                        </p>
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

      {/* Popup: trainees working on assignment — completed / lagging (assignment card click) */}
      {selectedAssignmentForList && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedAssignmentForList(null)}
        >
          <div
            className="bg-white dark:bg-[#1f2937] rounded-xl shadow-lg max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#e5e7eb] dark:border-[#374151] flex items-center justify-between gap-2 flex-shrink-0">
              <h2 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb] min-w-0">
                Trainees on this assignment
              </h2>
              <button
                type="button"
                onClick={() => setSelectedAssignmentForList(null)}
                className="p-2 rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] dark:hover:bg-[#374151] shrink-0"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex-shrink-0 border-b border-[#e5e7eb] dark:border-[#374151]">
              <p className="font-medium text-[#171717] dark:text-[#f9fafb]">{selectedAssignmentForList.label}</p>
              <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mt-0.5">
                {new Date(selectedAssignmentForList.date + "Z").toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              {selectedAssignmentForList.enrolledTraineesWithStatus && selectedAssignmentForList.enrolledTraineesWithStatus.length > 0 && (
                <p className="text-sm font-medium text-[#171717] dark:text-[#f9fafb] mt-2">
                  {selectedAssignmentForList.enrolledTraineesWithStatus.filter((t) => t.submitted).length} submitted
                  {" · "}
                  {selectedAssignmentForList.enrolledTraineesWithStatus.filter((t) => !t.submitted).length} not submitted
                </p>
              )}
            </div>
            <div className="p-4 overflow-y-auto flex-1 min-h-0">
              {(!selectedAssignmentForList.enrolledTraineesWithStatus?.length) ? (
                <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] py-4 text-center">
                  No trainees in this assignment&apos;s program.
                </p>
              ) : (
                <ul className="space-y-2">
                  {selectedAssignmentForList.enrolledTraineesWithStatus!.map((t) => (
                    <li
                      key={t.id}
                      className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827] p-3 flex items-center justify-between gap-2 flex-wrap"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-[#171717] dark:text-[#f9fafb]">{t.name || "—"}</p>
                        <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mt-0.5">{t.email || "—"}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                          t.submitted
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {t.submitted ? "Submitted" : "Not submitted"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-4 border-t border-[#e5e7eb] dark:border-[#374151] flex flex-wrap gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedAssignmentForList(null)}
                className="rounded-lg border border-[#d1d5db] dark:border-[#4b5563] bg-white dark:bg-[#1f2937] text-[#374151] dark:text-[#e5e7eb] py-2 px-3 text-sm font-medium hover:bg-[#f3f4f6] dark:hover:bg-[#374151]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup: course schedule — course data + enrolled trainees (course card click) */}
      {selectedCourseForList && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedCourseForList(null)}
        >
          <div
            className="bg-white dark:bg-[#1f2937] rounded-xl shadow-lg max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#e5e7eb] dark:border-[#374151] flex items-center justify-between gap-2 flex-shrink-0">
              <h2 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb] min-w-0">
                Course schedule
              </h2>
              <button
                type="button"
                onClick={() => setSelectedCourseForList(null)}
                className="p-2 rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] dark:hover:bg-[#374151] shrink-0"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex-shrink-0 border-b border-[#e5e7eb] dark:border-[#374151]">
              <p className="font-medium text-[#171717] dark:text-[#f9fafb]">{selectedCourseForList.label}</p>
              <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mt-0.5">
                {new Date(selectedCourseForList.date + "Z").toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              {selectedCourseForList.programName && (
                <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mt-0.5">{selectedCourseForList.programName}</p>
              )}
              {selectedCourseForList.moduleTitle && (
                <p className="text-sm font-medium text-[#171717] dark:text-[#f9fafb] mt-2">{selectedCourseForList.moduleTitle}</p>
              )}
            </div>
            <div className="p-4 overflow-y-auto flex-1 min-h-0 space-y-4">
              {selectedCourseForList.scheduledTraineesForDay && selectedCourseForList.scheduledTraineesForDay.length >= 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] dark:text-[#9ca3af] mb-2">
                    Scheduled for today (3hr)
                  </p>
                  {(selectedCourseForList.scheduledTraineesForDay?.length ?? 0) === 0 ? (
                    <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] py-2">No trainees booked for today&apos;s 3hr slot.</p>
                  ) : (
                    <ul className="space-y-2">
                      {selectedCourseForList.scheduledTraineesForDay!.map((t) => (
                        <li
                          key={t.id}
                          className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-[#f0fdf4] dark:bg-emerald-900/20 p-3"
                        >
                          <p className="font-medium text-[#171717] dark:text-[#f9fafb]">{t.name || "—"}</p>
                          <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mt-0.5">{t.email || "—"}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] dark:text-[#9ca3af] mb-2">
                  Trainees registered for this course
                </p>
                {(!selectedCourseForList.enrolledTrainees?.length) ? (
                  <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] py-2">
                    No trainees enrolled in this course yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {selectedCourseForList.enrolledTrainees!.map((t) => (
                      <li
                        key={t.id}
                        className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827] p-3"
                      >
                        <p className="font-medium text-[#171717] dark:text-[#f9fafb]">{t.name || "—"}</p>
                        <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mt-0.5">{t.email || "—"}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-[#e5e7eb] dark:border-[#374151] flex flex-wrap gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCourseForList(null)}
                className="rounded-lg border border-[#d1d5db] dark:border-[#4b5563] bg-white dark:bg-[#1f2937] text-[#374151] dark:text-[#e5e7eb] py-2 px-3 text-sm font-medium hover:bg-[#f3f4f6] dark:hover:bg-[#374151]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRequest && (
        <SummaryModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={() => updateStatus(selectedRequest.id, "APPROVED")}
          onReject={() => updateStatus(selectedRequest.id, "REJECTED")}
          loading={loadingId === selectedRequest.id}
        />
      )}
    </>
  );
}
