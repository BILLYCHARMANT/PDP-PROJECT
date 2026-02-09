"use client";

import { useMemo, useState } from "react";
import { PlanningCalendar } from "@/components/trainee/PlanningCalendar";
import { PlanningStatsCards } from "@/components/trainee/PlanningStatsCards";
import { PlanningDownloadCard } from "@/components/trainee/PlanningDownloadCard";
import { PlanningScheduledTasksList, type ScheduleItem } from "@/components/trainee/PlanningScheduledTasksList";
import { UpcomingScheduleList, type UpcomingItem } from "@/components/trainee/UpcomingScheduleList";
import { ScheduleEventFormModal } from "@/components/trainee/ScheduleEventFormModal";

type AssignmentItem = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | string | null;
  moduleId: string;
  moduleTitle: string;
  programId: string;
  programName: string;
};

type EnrollmentItem = {
  cohortStart: Date | string | null;
  cohortEnd: Date | string | null;
  programName: string;
  programId: string;
};

type PlanningStats = {
  completedScheduledTasks: number;
  totalScheduledTasks: number;
  courseProgressPercent: number;
  cohortDuration: string | null;
};

type UserInfo = { name: string; cohortName: string };

export function TraineePlanningContent({
  assignments,
  enrollments,
  scheduleItems,
  userInfo,
  resumeUrl,
  resumeLabel,
  stats,
}: {
  assignments: AssignmentItem[];
  enrollments: EnrollmentItem[];
  scheduleItems: ScheduleItem[];
  userInfo: UserInfo;
  resumeUrl?: string | null;
  resumeLabel?: string | null;
  stats: PlanningStats;
}) {
  const [selectedDateForSchedule, setSelectedDateForSchedule] = useState<string | null>(null);
  const scheduledDates = useMemo(
    () =>
      scheduleItems.map((s) => ({
        date: s.date,
        label: s.label,
        type: s.type,
      })),
    [scheduleItems]
  );

  const cohortStart = useMemo(() => {
    const starts = enrollments.map((e) => e.cohortStart).filter(Boolean);
    if (starts.length === 0) return null;
    return new Date(starts[0] as string).toISOString().slice(0, 10);
  }, [enrollments]);

  const cohortEnd = useMemo(() => {
    const ends = enrollments.map((e) => e.cohortEnd).filter(Boolean);
    if (ends.length === 0) return null;
    return new Date(ends[0] as string).toISOString().slice(0, 10);
  }, [enrollments]);

  const upcomingItems = useMemo((): Omit<UpcomingItem, "status">[] => {
    const scheduleRequests = scheduleItems.filter(
      (s) => s.type === "lab_workshop" || s.type === "mentor_meeting" || s.type === "course_schedule"
    );
    const sorted = [...scheduleRequests].sort((a, b) => {
      const c = a.date.localeCompare(b.date);
      if (c !== 0) return c;
      return (a.startTime || "").localeCompare(b.startTime || "");
    });
    return sorted.map((s) => ({
      id: s.id,
      title: s.label,
      date: (() => {
        const d = new Date(s.date + "Z");
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      })(),
      dateStr: s.date,
      startTime: s.startTime ?? undefined,
      endTime: s.endTime ?? undefined,
      location: s.location ?? undefined,
      type: s.type as "lab_workshop" | "mentor_meeting" | "course_schedule",
      requestStatus: (s.requestStatus as "PENDING" | "APPROVED" | "REJECTED") ?? undefined,
      description: s.description ?? undefined,
      equipmentNeeded: s.equipmentNeeded ?? undefined,
      teamMembers: s.teamMembers ?? undefined,
      requestCoffee: s.requestCoffee ?? false,
      mentorName: s.mentorName ?? undefined,
      chapterLabel: (s as { chapterLabel?: string }).chapterLabel ?? undefined,
    }));
  }, [scheduleItems]);

  const firstEnrollment = enrollments[0];
  const displayCohortStart = firstEnrollment?.cohortStart
    ? new Date(firstEnrollment.cohortStart).toISOString().slice(0, 10)
    : null;
  const displayCohortEnd = firstEnrollment?.cohortEnd
    ? new Date(firstEnrollment.cohortEnd).toISOString().slice(0, 10)
    : null;

  return (
    <>
      <div className="h-full min-h-0 flex flex-col gap-3 overflow-hidden">
        {/* Top row: 3 stats + Download files */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
          <PlanningStatsCards
          completedScheduledTasks={stats.completedScheduledTasks}
          totalScheduledTasks={stats.totalScheduledTasks}
          courseProgressPercent={stats.courseProgressPercent}
          cohortDuration={stats.cohortDuration}
        />
        <PlanningDownloadCard />
      </div>

      {/* Same layout as admin: left (calendar + upcoming) | right (scheduled tasks) — no video/lesson cards */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,360px)] gap-3 overflow-hidden">
        <div className="min-h-0 flex flex-col gap-3 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0 items-stretch">
            <div className="min-h-0 flex flex-col">
              <PlanningCalendar
                scheduledDates={scheduledDates}
                cohortStart={displayCohortStart}
                cohortEnd={displayCohortEnd}
                onDateClick={(dateStr) => {
                  const today = new Date().toISOString().slice(0, 10);
                  if (dateStr >= today) setSelectedDateForSchedule(dateStr);
                }}
              />
            </div>
            <div className="min-h-0 overflow-auto flex flex-col">
              <UpcomingScheduleList items={upcomingItems} />
            </div>
          </div>
        </div>
        <div className="hidden lg:flex flex-col min-h-0 overflow-hidden">
          <PlanningScheduledTasksList
            items={scheduleItems.filter((s) => s.type !== "lab_workshop" && s.type !== "mentor_meeting" && s.type !== "course_schedule")}
            resumeUrl={resumeUrl ?? undefined}
            resumeLabel={resumeLabel ?? undefined}
          />
        </div>
      </div>
    </div>

      {selectedDateForSchedule && (
        <ScheduleEventFormModal
          defaultDate={selectedDateForSchedule}
          userName={userInfo.name}
          cohortName={userInfo.cohortName}
          onClose={() => setSelectedDateForSchedule(null)}
          onSuccess={() => setSelectedDateForSchedule(null)}
        />
      )}
    </>
  );
}
