"use client";

export function PlanningStudentRating() {
  const rows = [1, 2, 3, 4, 5];

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-3 shadow-sm flex flex-col min-h-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">
        Student rating
      </p>
      <div className="grid grid-cols-[1fr_auto] gap-2 text-xs font-semibold uppercase tracking-wider text-[#6b7280] border-b border-[#e5e7eb] pb-2">
        <span>Student</span>
        <span>Points</span>
      </div>
      <ul className="flex-1 min-h-0 overflow-auto space-y-2 mt-2">
        {rows.map((i) => (
          <li key={i} className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-6 w-6 shrink-0 rounded-full bg-[#e5e7eb] items-center justify-center text-[10px] font-medium text-[#6b7280]">
                {i}
              </span>
              <span className="truncate text-[#374151]">—</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[#374151]">—</span>
              <button type="button" className="p-0.5 text-[#9ca3af] hover:text-[#6b7280]" aria-label="Options">
                <span className="text-[#9ca3af]">⋮</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
