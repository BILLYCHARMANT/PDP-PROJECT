"use client";

import Link from "next/link";

export function PlanningDownloadCard() {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-3 shadow-sm flex-shrink-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
        Schedule pass
      </p>
      <p className="mt-0.5 text-xs text-[#6b7280]">
        For reception (approved visits only)
      </p>
      <Link
        href="/dashboard/trainee/planning/pass"
        className="mt-2 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#d1d5db] bg-[#f9fafb] py-5 px-4 hover:border-[var(--unipod-blue)] hover:bg-[var(--unipod-blue-light)] transition-colors"
      >
        <svg className="w-8 h-8 text-[#9ca3af] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-sm font-medium text-[#374151]">Download schedule pass</span>
        <span className="text-xs text-[#6b7280] mt-0.5 text-center">Shows your photo and approved visits</span>
      </Link>
    </div>
  );
}
