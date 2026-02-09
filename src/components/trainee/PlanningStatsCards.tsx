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

  return (
    <>
      {/* Lab time – 3 hr/day requirement */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-3 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
          Lab time
        </p>
        <p className="mt-1 text-xl font-bold text-[#171717]">
          {LAB_HOURS_PER_DAY} hrs
        </p>
        <p className="mt-0.5 text-xs text-[#6b7280]">
          Daily lab requirement
        </p>
      </div>

      {/* Completed scheduled tasks */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-3 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
          Scheduled tasks
        </p>
        <p className="mt-1 text-xl font-bold text-[#171717]">
          {completedScheduledTasks} / {totalScheduledTasks}
        </p>
        <p className="mt-0.5 text-xs text-[#6b7280]">
          {cohortDuration ? `Duration: ${cohortDuration}` : "Completed vs total"}
        </p>
      </div>

      {/* Course progress – large semicircular gauge (same as reference design) */}
      <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-4 shadow-sm min-h-[160px] flex flex-col">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] dark:text-[#9ca3af]">
          Course progress
        </p>
        <div className="mt-2 flex flex-1 items-stretch justify-between gap-3 min-h-0">
          <div className="flex flex-col justify-center">
            <p className="leading-none">
              <span className="text-3xl font-bold text-[#171717] dark:text-[#f9fafb]">
                {Math.floor(courseProgressPercent / 10)}
              </span>
              <span className="text-xl font-normal text-[#171717] dark:text-[#f9fafb] align-top">
                .{Math.round(((courseProgressPercent / 10) % 1) * 10)}
              </span>
            </p>
            <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-0.5">
              Average score
            </p>
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
            <span className="absolute inset-0 flex items-center justify-center pt-3 pointer-events-none">
              <span className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">
                {courseProgressPercent}
                <span className="text-lg font-normal align-top">%</span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
