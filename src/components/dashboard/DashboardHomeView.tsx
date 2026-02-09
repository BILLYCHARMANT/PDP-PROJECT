import Link from "next/link";
import { ActivityBarChart, SubmissionDonutChart } from "@/components/dashboard/MentorHomeCharts";
import type { ApprovalRequestCard } from "@/lib/dashboardHomeData";

export type HomeMetric = { label: string; value: number };
export type HomeActivityDay = { date: string; label: string; count: number };
export type HomeDonutItem = { name: string; value: number; color: string };
export type HomeSection = { title: string; seeAllHref: string; content: React.ReactNode };

const APPROVAL_CARD_ICONS: Record<string, React.ReactNode> = {
  access: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  ),
  attending: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
  ),
  technical: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536-3.536l3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
  ),
  course: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  ),
};
const APPROVAL_ICON_KEYS = ["access", "attending", "technical", "course"] as const;

export function DashboardHomeView({
  welcome,
  metrics,
  activityData,
  donutData,
  sections,
  approvalRequests,
}: {
  welcome: { firstName: string; subtitle: string };
  metrics: HomeMetric[];
  activityData: HomeActivityDay[];
  donutData: HomeDonutItem[];
  sections: [HomeSection, HomeSection, HomeSection, HomeSection];
  approvalRequests?: ApprovalRequestCard[];
}) {
  const showApprovalCards = approvalRequests && approvalRequests.length > 0;

  return (
    <div
      className="min-h-full rounded-xl p-6"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      {showApprovalCards ? (
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {approvalRequests!.map((req, i) => {
              const isBlue = req.color === "orange";
              const borderClass = isBlue
                ? "border-l-[var(--unipod-blue)] hover:border-[var(--unipod-blue)] hover:bg-[var(--unipod-blue-light)] dark:hover:bg-[#1e3a5f]"
                : "border-l-[var(--unipod-yellow)] hover:border-[var(--unipod-yellow)] hover:bg-[var(--unipod-yellow-bg)] dark:hover:bg-[#422006]";
              const iconBgStyle = isBlue ? { backgroundColor: "var(--unipod-blue-light)" } : { backgroundColor: "var(--unipod-yellow-bg)" };
              const iconColorStyle = isBlue ? { color: "var(--unipod-blue)" } : { color: "var(--unipod-yellow)" };
              const iconKey = APPROVAL_ICON_KEYS[i] ?? "access";
              return (
                <Link
                  key={`${req.label}-${req.href}`}
                  href={req.href}
                  className={`rounded-lg border border-[#e5e7eb] dark:border-[#374151] border-l-4 bg-white dark:bg-[#1f2937] shadow-sm transition-colors flex items-center gap-2 py-2.5 px-3 ${borderClass}`}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={iconBgStyle}
                  >
                    <svg className="h-4 w-4" style={iconColorStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {APPROVAL_CARD_ICONS[iconKey] ?? APPROVAL_CARD_ICONS.access}
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#171717] dark:text-[#f9fafb] leading-tight">{req.label}</p>
                    {req.count > 0 && (
                      <p className="mt-0.5 text-xs text-[#6b7280] dark:text-[#9ca3af]">
                        {req.count} pending
                      </p>
                    )}
                  </div>
                  {req.count > 0 && (
                    <span className="flex h-6 min-w-[1.5rem] shrink-0 items-center justify-center rounded-full bg-[#e5e7eb] dark:bg-[#374151] px-1.5 text-xs font-bold text-[#171717] dark:text-[#f9fafb]">
                      {req.count > 99 ? "99+" : req.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">
            Welcome, {welcome.firstName}
          </h1>
          <p className="mt-1 text-[#6b7280] dark:text-[#9ca3af]">{welcome.subtitle}</p>
        </div>
      )}

      {/* Top row: 4 metric cards — compact, number against icon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {metrics.map((m, i) => (
          <div
            key={i}
            className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-3 shadow-sm flex items-center gap-3"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: i === 0 ? "var(--unipod-blue-light)" : i === 1 ? "var(--unipod-yellow-bg)" : i === 2 ? "var(--unipod-blue-light)" : "var(--unipod-yellow-bg)",
              }}
            >
              <svg
                className="h-5 w-5"
                style={{
                  color: i === 0 || i === 2 ? "var(--unipod-blue)" : "var(--unipod-yellow)",
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {i === 0 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />}
                {i === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5H4a2 2 0 01-2-2V5a2 2 0 012-2h2V3a2 2 0 012 2v2h2a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2v-5z" />}
                {i === 2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
                {i === 3 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
              </svg>
            </div>
            <div className="min-w-0 flex-1 flex flex-col items-end justify-center">
              <p className="text-xs font-medium text-[#6b7280] dark:text-[#9ca3af]">{m.label}</p>
              <p className="text-xl font-bold text-[#171717] dark:text-[#f9fafb] leading-none tabular-nums">{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Middle row: Activity bar chart + Submission donut — same for all roles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb]">Activity</h2>
          <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mb-2">Submissions per day</p>
          <ActivityBarChart data={activityData} />
        </div>
        <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb]">Submission status</h2>
          <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mb-2">By status</p>
          <SubmissionDonutChart data={donutData} />
        </div>
      </div>

      {/* Bottom: 4 list sections in 2x2 grid — same structure, content by role */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((sec, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb]">{sec.title}</h2>
              <Link href={sec.seeAllHref} className="text-sm font-medium" style={{ color: "var(--unipod-blue)" }}>
                See all →
              </Link>
            </div>
            {sec.content}
          </div>
        ))}
      </div>
    </div>
  );
}
