"use client";

export function PlanningLessonDetailsCard() {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-1">
            <span className="inline-block rounded px-2 py-0.5 text-[10px] font-medium text-white bg-orange-500">
              Course
            </span>
            <span className="inline-block rounded px-2 py-0.5 text-[10px] font-medium bg-[#e5e7eb] text-[#374151]">
              Module
            </span>
          </div>
          <p className="font-semibold text-[#171717] text-sm">Lesson title</p>
          <p className="text-xs text-[#6b7280] mt-0.5">—</p>
          <p className="text-xs text-[#6b7280] mt-1 line-clamp-2">
            Lesson description will appear here.
          </p>
        </div>
        <button type="button" className="shrink-0 p-1 text-[#9ca3af] hover:text-[#6b7280]" aria-label="Open">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
