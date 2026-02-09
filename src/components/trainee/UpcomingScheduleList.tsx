"use client";

import { useState } from "react";

export type UpcomingItem = {
  id: string;
  title: string;
  date: string;
  dateStr?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  type: "lab_workshop" | "mentor_meeting" | "course_schedule";
  status: "active" | "ended";
  /** PENDING | APPROVED | REJECTED — request status until admin approves */
  requestStatus?: "PENDING" | "APPROVED" | "REJECTED";
  description?: string;
  equipmentNeeded?: string;
  teamMembers?: string;
  requestCoffee?: boolean;
  mentorName?: string;
  /** For course_schedule: module → chapter (lesson) */
  chapterLabel?: string;
};

/** Event is ended when current time is past the event's end (date + endTime). */
function getEventStatus(dateStr: string | undefined, endTime: string | undefined): "active" | "ended" {
  if (!dateStr) return "ended";
  const end = endTime ? `${dateStr}T${endTime}:00` : `${dateStr}T23:59:00`;
  const eventEnd = new Date(end).getTime();
  return Date.now() < eventEnd ? "active" : "ended";
}

function getEventEndTime(dateStr: string | undefined, endTime: string | undefined): number {
  if (!dateStr) return 0;
  const end = endTime ? `${dateStr}T${endTime}:00` : `${dateStr}T23:59:00`;
  return new Date(end).getTime();
}

const typeTagLabel: Record<UpcomingItem["type"], string> = {
  lab_workshop: "LAB ACCESS",
  mentor_meeting: "TECHNICAL SUPPORT",
  course_schedule: "COURSE SCHEDULE",
};

const typeTagClass: Record<UpcomingItem["type"], string> = {
  lab_workshop: "bg-violet-500 text-white",
  mentor_meeting: "bg-purple-600 text-white",
  course_schedule: "bg-sky-600 text-white",
};

const statusTagClass: Record<UpcomingItem["status"], string> = {
  active: "bg-emerald-500/15 text-emerald-700 border-emerald-300",
  ended: "bg-red-100 text-red-800 border-red-300",
};
const statusLabel: Record<UpcomingItem["status"], string> = {
  active: "Active",
  ended: "Ended",
};

const requestStatusLabel: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};
const requestStatusTagClass: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-300",
  APPROVED: "bg-green-100 text-green-800 border-green-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
};

function SummaryModal({ item, onClose }: { item: UpcomingItem; onClose: () => void }) {
  const timeRange = [item.startTime, item.endTime].filter(Boolean).join(" – ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#171717]">Request summary</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#171717]"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0 ${typeTagClass[item.type]}`}
            >
              {typeTagLabel[item.type]}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {item.requestStatus && (
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase border ${requestStatusTagClass[item.requestStatus] ?? "bg-slate-100 text-slate-700 border-slate-300"}`}
                >
                  {requestStatusLabel[item.requestStatus] ?? item.requestStatus}
                </span>
              )}
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase border shrink-0 ${statusTagClass[item.status]}`}
              >
                {statusLabel[item.status]}
              </span>
            </div>
          </div>
          <p className="text-sm font-semibold text-[#171717] mt-2">{item.title}</p>
          <dl className="grid gap-2 text-sm mt-2">
            <div>
              <dt className="text-[#6b7280]">Date</dt>
              <dd className="font-medium text-[#171717]">{item.date}</dd>
            </div>
            {timeRange && (
              <div>
                <dt className="text-[#6b7280]">Time</dt>
                <dd className="font-medium text-[#171717]">{timeRange}</dd>
              </div>
            )}
            {item.location && (
              <div>
                <dt className="text-[#6b7280]">Location</dt>
                <dd className="font-medium text-[#171717]">{item.location}</dd>
              </div>
            )}
            {(item.type === "mentor_meeting" || item.type === "course_schedule") && item.mentorName && (
              <div>
                <dt className="text-[#6b7280]">Mentor</dt>
                <dd className="font-medium text-[#171717]">{item.mentorName}</dd>
              </div>
            )}
            {item.type === "course_schedule" && item.chapterLabel && (
              <div>
                <dt className="text-[#6b7280]">Chapter to attend</dt>
                <dd className="font-medium text-[#171717]">{item.chapterLabel}</dd>
              </div>
            )}
            {item.requestCoffee && (
              <div>
                <dt className="text-[#6b7280]">Coffee</dt>
                <dd className="font-medium text-[#171717]">Requested</dd>
              </div>
            )}
            {item.teamMembers && (
              <div>
                <dt className="text-[#6b7280]">Team members / visitors</dt>
                <dd className="font-medium text-[#171717]">{item.teamMembers}</dd>
              </div>
            )}
            {item.equipmentNeeded && (
              <div>
                <dt className="text-[#6b7280]">Equipment needed</dt>
                <dd className="font-medium text-[#171717]">{item.equipmentNeeded}</dd>
              </div>
            )}
            {item.description && (
              <div>
                <dt className="text-[#6b7280]">Description</dt>
                <dd className="font-medium text-[#171717] whitespace-pre-wrap">{item.description}</dd>
              </div>
            )}
          </dl>
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UpcomingScheduleList({ items }: { items: Omit<UpcomingItem, "status">[] }) {
  const [selectedItem, setSelectedItem] = useState<UpcomingItem | null>(null);

  const itemsWithStatus: UpcomingItem[] = (() => {
    const withStatus: UpcomingItem[] = items.map((item) => ({
      ...item,
      status: getEventStatus(item.dateStr, item.endTime),
    }));
    return withStatus.sort((a, b) => {
      const aEnd = getEventEndTime(a.dateStr, a.endTime);
      const bEnd = getEventEndTime(b.dateStr, b.endTime);
      const aActive = a.status === "active" ? 1 : 0;
      const bActive = b.status === "active" ? 1 : 0;
      if (bActive !== aActive) return bActive - aActive;
      if (a.status === "active") return aEnd - bEnd;
      return bEnd - aEnd;
    });
  })();

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-3 shadow-sm h-full flex flex-col min-h-0">
        <h3 className="text-sm font-semibold text-[#171717] mb-2 flex-shrink-0">Upcoming schedule</h3>
        <p className="text-sm text-[#6b7280] flex-1">
          No upcoming labs, workshops or mentor meetings. Click a date on the calendar to schedule one.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-3 shadow-sm h-full flex flex-col min-h-0">
        <h3 className="text-sm font-semibold text-[#171717] mb-2 flex-shrink-0">Upcoming schedule</h3>
        <ul className="space-y-2 flex-1 min-h-0 overflow-auto">
          {itemsWithStatus.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelectedItem(item)}
                className="w-full text-left rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 hover:border-[#d1d5db] hover:bg-[#f3f4f6] transition-colors"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0 ${typeTagClass[item.type]}`}
                  >
                    {typeTagLabel[item.type]}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.requestStatus && (
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase border ${requestStatusTagClass[item.requestStatus] ?? "bg-slate-100 text-slate-700 border-slate-300"}`}
                      >
                        {requestStatusLabel[item.requestStatus] ?? item.requestStatus}
                      </span>
                    )}
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase border shrink-0 ${statusTagClass[item.status]}`}
                    >
                      {statusLabel[item.status]}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#6b7280] mt-2">{item.date}</p>
                {(item.startTime || item.endTime) && (
                  <p className="text-xs text-[#6b7280] mt-0.5">
                    {[item.startTime, item.endTime].filter(Boolean).join(" – ")}
                  </p>
                )}
                <p className="mt-1.5 font-semibold text-[#171717] text-sm">{item.title}</p>
                {item.location && <p className="text-xs text-[#9ca3af] mt-1">{item.location}</p>}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {selectedItem && (
        <SummaryModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </>
  );
}
