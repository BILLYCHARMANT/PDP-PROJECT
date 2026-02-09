"use client";

export function PlanningVideoCard() {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">
        Video of the lesson
      </p>
      <div className="aspect-video rounded-lg bg-[#f3f4f6] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[#e5e7eb]/50" />
        <button
          type="button"
          className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white"
          aria-label="Play"
        >
          <svg className="w-6 h-6 text-[#374151] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
