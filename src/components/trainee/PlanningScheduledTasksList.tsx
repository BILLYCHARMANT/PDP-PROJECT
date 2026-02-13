"use client";

import Link from "next/link";

export type ScheduleItemType =
  | "course_start"
  | "course_end"
  | "module_start"
  | "module_end"
  | "assignment_due"
  | "lab_workshop"
  | "mentor_meeting"
  | "course_schedule";

export type ScheduleItem = {
  id: string;
  type: ScheduleItemType;
  date: string;
  label: string;
  programName?: string;
  moduleTitle?: string;
  href?: string;
  /** For lab/mentor: display time and location */
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  /** For lab/mentor: summary popup */
  description?: string | null;
  equipmentNeeded?: string | null;
  teamMembers?: string | null;
  requestCoffee?: boolean;
  mentorName?: string | null;
  /** PENDING | APPROVED | REJECTED — only for lab/mentor */
  requestStatus?: string;
  /** For assignment_due in admin: trainees scheduled for this day's 3hr attendance */
  scheduledTraineesForDay?: { id: string; name: string | null; email: string | null }[];
  /** For assignment_due in admin: trainees in program with submitted (true) or not submitted (false) */
  enrolledTraineesWithStatus?: { id: string; name: string | null; email: string | null; submitted: boolean }[];
  /** For course_start/course_end in admin: trainees enrolled in the course */
  enrolledTrainees?: { id: string; name: string | null; email: string | null }[];
  programId?: string;
  /** For assignment_due: ISO datetime when assignment closes (for Active/Closed tag) */
  dueDateTime?: string;
  /** For course_schedule: module → lesson label */
  chapterLabel?: string;
};

const typeLabels: Record<ScheduleItemType, string> = {
  course_start: "Course start",
  course_end: "Course end",
  module_start: "Module start",
  module_end: "Module end",
  assignment_due: "Assignment",
  lab_workshop: "Lab access",
  mentor_meeting: "Technical support",
  course_schedule: "Course schedule",
};

const typeBadgeClass: Record<ScheduleItemType, string> = {
  course_start: "bg-blue-500/15 text-blue-700 border-blue-200",
  course_end: "bg-blue-700/15 text-blue-800 border-blue-300",
  module_start: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
  module_end: "bg-emerald-700/15 text-emerald-800 border-emerald-300",
  assignment_due: "bg-orange-500/15 text-orange-700 border-orange-200",
  lab_workshop: "bg-violet-500/15 text-violet-700 border-violet-200",
  mentor_meeting: "bg-purple-500/15 text-purple-700 border-purple-200",
  course_schedule: "bg-sky-500/15 text-sky-700 border-sky-200",
};

const statusTagClass = {
  active: "bg-emerald-500/15 text-emerald-700 border-emerald-300",
  ended: "bg-red-100 text-red-800 border-red-300",
};

export function PlanningScheduledTasksList({
  items,
  resumeUrl,
  resumeLabel,
  compact,
  onAssignmentCardClick,
  onCourseCardClick,
}: {
  items: ScheduleItem[];
  resumeUrl?: string;
  resumeLabel?: string;
  /** When true, render only the list (no wrapper card, no title). For embedding in admin panel. */
  compact?: boolean;
  /** When provided, assignment cards are clickable to show trainee list (e.g. admin popup). */
  onAssignmentCardClick?: (item: ScheduleItem) => void;
  /** When provided, course_start/course_end cards are clickable to show course data and enrolled list. */
  onCourseCardClick?: (item: ScheduleItem) => void;
}) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "Z");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const today = new Date().toISOString().slice(0, 10);
  const sortedItems = [...items].sort((a, b) => {
    const aActive = a.date >= today ? 1 : 0;
    const bActive = b.date >= today ? 1 : 0;
    if (bActive !== aActive) return bActive - aActive;
    if (a.date >= today) return a.date.localeCompare(b.date);
    return b.date.localeCompare(a.date);
  });

  const showResume = resumeUrl && resumeLabel;

  if (items.length === 0 && !showResume) {
    if (compact) return null;
    return (
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-3 shadow-sm flex flex-col min-h-0 h-full">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">Scheduled tasks</p>
        <p className="text-sm text-[#6b7280] flex-1">No scheduled dates. Course and module timelines will appear here when set by your mentor.</p>
      </div>
    );
  }

  const listContent = (
    <>
      {!compact && showResume && (
        <Link
          href={resumeUrl}
          className="mb-3 flex items-center gap-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-3.5 text-left font-medium text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100 transition-colors shadow-sm"
        >
          <span className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white" aria-hidden>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">{resumeLabel}</span>
          <svg className="h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
      <ul className={compact ? "space-y-2" : "flex-1 min-h-0 overflow-auto space-y-2"}>
        {sortedItems.map((item) => {
          const status = item.date >= today ? "active" : "ended";
          const isAssignment = item.type === "assignment_due";

          const assignmentContent = (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-block rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shrink-0">
                  Assignment
                </span>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase shrink-0 ${status === "active" ? "bg-emerald-500/15 text-emerald-700 border border-emerald-300" : "bg-red-100 text-red-800 border border-red-300"}`}>
                  {status === "active" ? "Active" : "Ended"}
                </span>
              </div>
              <p className="text-xs text-[#6b7280] mt-1.5">{formatDate(item.date)}</p>
              <p className="mt-1.5 font-semibold text-[#171717] text-sm">{item.label}</p>
              {item.moduleTitle && (
                <p className="text-xs text-[#6b7280] mt-0.5 line-clamp-2">{item.moduleTitle}</p>
              )}
              {item.href && !onAssignmentCardClick && (
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#6b7280] group-hover:text-[#171717]">
                  Open
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              )}
            </>
          );

          const defaultContent = (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase border shrink-0 ${typeBadgeClass[item.type]}`}>
                  {typeLabels[item.type]}
                </span>
                <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase border shrink-0 ${statusTagClass[status]}`}>
                  {status === "active" ? "Active" : "Ended"}
                </span>
              </div>
              <p className="text-xs text-[#6b7280] mt-1">{formatDate(item.date)}</p>
              {(item.startTime || item.endTime) && (
                <p className="text-xs text-[#6b7280]">
                  {[item.startTime, item.endTime].filter(Boolean).join(" – ")}
                </p>
              )}
              <p className="mt-1 font-medium text-[#171717] text-sm line-clamp-2">{item.label}</p>
              {item.location && (
                <p className="text-xs text-[#9ca3af] mt-0.5">{item.location}</p>
              )}
              {item.programName && !item.location && (
                <p className="text-xs text-[#9ca3af] mt-0.5">{item.programName}</p>
              )}
              {item.moduleTitle && (
                <p className="text-xs text-[#6b7280] mt-0.5">{item.moduleTitle}</p>
              )}
              {item.href &&
                !(item.type === "assignment_due" && onAssignmentCardClick) &&
                !((item.type === "course_start" || item.type === "course_end") && onCourseCardClick) && (
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#6b7280] group-hover:text-[#171717]">
                  Open
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              )}
            </>
          );

          const content = isAssignment ? assignmentContent : defaultContent;
          const cardClass = isAssignment
            ? "block rounded-xl border border-[#e5e7eb] bg-white p-3.5 shadow-sm hover:border-[#d1d5db] hover:shadow transition-colors group"
            : "block rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-3 hover:border-[#d1d5db] hover:bg-[#f3f4f6] transition-colors group";

          const isAssignmentWithPopup = item.type === "assignment_due" && onAssignmentCardClick;
          const isCourseWithPopup =
            (item.type === "course_start" || item.type === "course_end") && onCourseCardClick;
          return (
            <li key={item.id}>
              {isAssignmentWithPopup ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onAssignmentCardClick!(item)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onAssignmentCardClick!(item)}
                  className={`${cardClass} cursor-pointer`}
                >
                  {content}
                </div>
              ) : isCourseWithPopup ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onCourseCardClick!(item)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onCourseCardClick!(item)}
                  className={`${cardClass} cursor-pointer`}
                >
                  {content}
                </div>
              ) : item.href ? (
                <Link href={item.href} className={cardClass}>
                  {content}
                </Link>
              ) : (
                <div className={`${cardClass} opacity-90`}>
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );

  if (compact) return <div className="space-y-2">{listContent}</div>;

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-3 shadow-sm flex flex-col min-h-0 h-full">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">Scheduled tasks</p>
      {listContent}
    </div>
  );
}
