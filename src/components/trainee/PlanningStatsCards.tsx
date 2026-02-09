"use client";

const LAB_HOURS_PER_DAY = 3;

export function PlanningStatsCards({
  completedScheduledTasks,
  totalScheduledTasks,
  courseProgressPercent,
  cohortDuration,
}: {
  completedScheduledTasks: number;
  totalScheduledTasks: number;
  courseProgressPercent: number;
  cohortDuration: string | null;
}) {
  const isCourseComplete = courseProgressPercent >= 100;
  const progressColor = isCourseComplete ? "#22c55e" : "#f97316"; /* green when complete, else orange */
  const completionPercent = totalScheduledTasks > 0 
    ? Math.round((completedScheduledTasks / totalScheduledTasks) * 100) 
    : 0;

  return (
    <>
      {/* Lab Hours Card */}
      <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-4 shadow-sm min-h-[120px] flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-[#6b7280] dark:text-[#9ca3af] uppercase tracking-wide">Daily Lab Hours</p>
            <p className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb] mt-1">
              {LAB_HOURS_PER_DAY} <span className="text-lg font-normal text-[#6b7280] dark:text-[#9ca3af]">hrs</span>
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[#e5e7eb] dark:border-[#374151]">
          <div className="flex items-center gap-2 text-xs text-[#6b7280] dark:text-[#9ca3af]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Scheduled</span>
          </div>
        </div>
      </div>

      {/* Tasks Completion Card */}
      <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-4 shadow-sm min-h-[120px] flex flex-col justify-between">
        <div>
          <p className="text-xs font-medium text-[#6b7280] dark:text-[#9ca3af] uppercase tracking-wide mb-3">Tasks Completed</p>
          <div className="flex items-baseline gap-2 mb-4">
            <p className="text-3xl font-bold text-[#171717] dark:text-[#f9fafb]">
              {completedScheduledTasks}
            </p>
            <p className="text-lg font-normal text-[#6b7280] dark:text-[#9ca3af]">
              / {totalScheduledTasks}
            </p>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-[#6b7280] dark:text-[#9ca3af] mb-2">
            <span>Progress</span>
            <span className="font-medium">{completionPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#e5e7eb] dark:bg-[#374151] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${completionPercent}%`,
                backgroundColor: completionPercent === 100 ? "#22c55e" : "#6366f1",
              }}
            />
          </div>
        </div>
      </div>

      {/* Course Progress Card */}
      <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-4 shadow-sm min-h-[160px] flex flex-col">
        <p className="text-xs font-medium text-[#6b7280] dark:text-[#9ca3af] uppercase tracking-wide mb-4">Course Progress</p>
        <div className="flex flex-1 items-stretch justify-between gap-4 min-h-0">
          <div className="flex flex-col justify-center">
            <p className="leading-none">
              <span className="text-3xl font-bold text-[#171717] dark:text-[#f9fafb]">
                {Math.floor(courseProgressPercent / 10)}
              </span>
              <span className="text-xl font-normal text-[#171717] dark:text-[#f9fafb] align-top">
                .{Math.round(((courseProgressPercent / 10) % 1) * 10)}
              </span>
            </p>
            <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-2">Overall Score</p>
          </div>
          <div className="relative flex-shrink-0 w-[140px] h-[110px]" aria-hidden>
            <svg viewBox="0 0 120 70" className="w-full h-full block" preserveAspectRatio="xMidYMax meet">
              {/* Track – light grey arc */}
              <path
                d="M 12 58 A 48 48 0 0 1 108 58"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="14"
                strokeLinecap="round"
                className="dark:stroke-[#374151]"
              />
              {/* Progress arc – green when course complete, orange otherwise */}
              <path
                d="M 12 58 A 48 48 0 0 1 108 58"
                fill="none"
                stroke={progressColor}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${Math.min(courseProgressPercent / 100, 1) * 150.8} 150.8`}
              />
            </svg>
            {/* Percentage text centered in the circle area below the arc */}
            <span className="absolute left-0 right-0 flex items-center justify-center pointer-events-none" style={{ top: '72%', transform: 'translateY(-50%)' }}>
              <span className="text-xl font-bold text-[#171717] dark:text-[#f9fafb]">
                {courseProgressPercent}
                <span className="text-base font-normal align-top">%</span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
