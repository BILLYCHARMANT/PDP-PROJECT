"use client";

import { useState, useMemo } from "react";
import type { ScheduleItemType } from "./PlanningScheduledTasksList";

type ScheduledDate = {
  date: string;
  label: string;
  type: ScheduleItemType;
};

export function PlanningCalendar({
  scheduledDates,
  cohortStart,
  cohortEnd,
  onDateClick,
}: {
  scheduledDates: ScheduledDate[];
  cohortStart?: string | null;
  cohortEnd?: string | null;
  onDateClick?: (dateStr: string) => void;
}) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const monthLabel = new Date(viewDate.getFullYear(), viewDate.getMonth(), 12).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const datesByType = useMemo(() => {
    const map = new Map<string, Set<ScheduleItemType>>();
    const add = (dateStr: string, type: ScheduleItemType) => {
      const key = dateStr.slice(0, 10);
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(type);
    };
    scheduledDates.forEach((s) => add(s.date, s.type));
    if (cohortStart) add(cohortStart.slice(0, 10), "course_start");
    if (cohortEnd) add(cohortEnd.slice(0, 10), "course_end");
    return map;
  }, [scheduledDates, cohortStart, cohortEnd]);

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const lastDay = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();
  const totalCells = startPad + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  const goPrev = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1));
  const goNext = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1));

  const dayCells: { day: number | null; dateStr: string | null }[] = [];
  for (let i = 0; i < startPad; i++) dayCells.push({ day: null, dateStr: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    dayCells.push({ day: d, dateStr });
  }
  while (dayCells.length < rows * 7) dayCells.push({ day: null, dateStr: null });

  // Priority when a day has multiple types: trainee events (lab/mentor) first, then assignment > module > course
  const typePriority: ScheduleItemType[] = [
    "mentor_meeting",
    "lab_workshop",
    "assignment_due",
    "module_end",
    "module_start",
    "course_end",
    "course_start",
  ];
  const typeCellClass: Record<ScheduleItemType, string> = {
    course_start: "bg-blue-400 text-white",
    course_end: "bg-blue-600 text-white",
    module_start: "bg-emerald-400 text-white",
    module_end: "bg-emerald-600 text-white",
    assignment_due: "bg-orange-500 text-white",
    lab_workshop: "bg-violet-500 text-white",
    mentor_meeting: "bg-purple-500 text-white",
    course_schedule: "bg-teal-500 text-white",
  };

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const getCellShade = (types: Set<ScheduleItemType>): string | null => {
    if (types.size === 0) return null;
    const chosen = typePriority.find((t) => types.has(t)) ?? typePriority[0];
    return typeCellClass[chosen];
  };

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-3 shadow-sm h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h3 className="text-sm font-semibold text-[#171717]">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#171717]"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#171717]"
            aria-label="Next month"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center flex-1 min-h-0 content-start">
        {weekDays.map((wd) => (
          <div key={wd} className="py-0.5 text-[10px] font-semibold uppercase text-[#6b7280]">
            {wd}
          </div>
        ))}
        {dayCells.map((cell, i) => {
          if (cell.day === null) return <div key={i} className="aspect-square min-h-[28px]" />;
          const isToday = cell.dateStr === today;
          const types = cell.dateStr ? datesByType.get(cell.dateStr) : undefined;
          const shadeClass = types && types.size > 0 ? getCellShade(types) : null;
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (cell.dateStr && onDateClick) onDateClick(cell.dateStr);
              }}
              className={`aspect-square min-h-[28px] flex items-center justify-center rounded-lg text-sm font-medium w-full ${
                isToday
                  ? "bg-[#e5e7eb] text-[#171717] font-semibold ring-1 ring-[#d1d5db]"
                  : shadeClass ?? "text-[#374151] hover:bg-[#f9fafb]"
              } ${onDateClick ? "cursor-pointer" : ""}`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
