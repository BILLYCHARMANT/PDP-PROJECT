"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Module = { id: string; title: string; order: number };
type Progress = {
  overallPercent: number;
  allCompleted: boolean;
  modules: { moduleId: string; title: string; status: string; percentComplete: number }[];
};
type Deliverable = {
  id: string;
  title: string;
  moduleId: string;
  moduleTitle: string;
  dueDate: string | null;
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDateRange(start: string | null, end: string | null) {
  if (!start || !end) return "—";
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} – ${e.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}

export function TraineeDashboardHome({
  programName,
  programId,
  modules,
  firstName,
  cohortStart,
  cohortEnd,
  pendingDeliverables,
}: {
  programName: string;
  programId: string;
  modules: Module[];
  firstName: string;
  cohortStart: string | null;
  cohortEnd: string | null;
  pendingDeliverables: Deliverable[];
}) {
  const [progress, setProgress] = useState<Progress | null>(null);
  useEffect(() => {
    fetch(`/api/progress?programId=${programId}`)
      .then((r) => r.json())
      .then(setProgress)
      .catch(() => setProgress(null));
  }, [programId]);

  const moduleProgress = progress?.modules ?? [];
  const byModule = Object.fromEntries(moduleProgress.map((m) => [m.moduleId, m]));
  const currentIndex = moduleProgress.findIndex((m) => m.status !== "COMPLETED");
  const continueModule =
    currentIndex >= 0 && modules[currentIndex]
      ? modules[currentIndex]
      : modules[modules.length - 1];
  const currentModuleProgress = continueModule ? byModule[continueModule.id] : null;
  const overallPercent = progress?.overallPercent ?? 0;
  const allCompleted = progress?.allCompleted ?? false;
  const tasksForCurrentPeriod = currentModuleProgress
    ? currentModuleProgress.percentComplete
    : 0;

  return (
    <div className="space-y-8">
      {/* Hero banner: Resume CTA */}
      {continueModule && (
        <div
          className="relative overflow-hidden rounded-2xl border border-[#e5e7eb] px-6 py-6 md:py-8"
          style={{
            background: `linear-gradient(135deg, var(--unipod-blue-light) 0%, rgba(255,255,255,0.95) 50%)`,
          }}
        >
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#6b7280]">Continue your journey</p>
              <p className="mt-1 text-xl font-bold text-[#171717]">{continueModule.title}</p>
              <p className="mt-0.5 text-sm text-[#6b7280]">
                Module {modules.findIndex((m) => m.id === continueModule.id) + 1} of {modules.length}
              </p>
            </div>
            <Link
              href={`/dashboard/trainee/learn/${continueModule.id}`}
              className="inline-flex shrink-0 items-center justify-center rounded-xl px-6 py-3 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
              style={{ backgroundColor: "var(--unipod-blue)" }}
            >
              Resume
            </Link>
          </div>
        </div>
      )}

      {/* Three summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* You were busy with */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#374151]">You were busy with</h3>
          <p className="mt-2 text-lg font-bold text-[#171717]">
            {continueModule?.title ?? "—"}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-[#6b7280]">
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDateRange(cohortStart, cohortEnd)}
          </div>
          <p className="mt-2 text-sm text-[#6b7280]">Tasks completed for this module</p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--sidebar-bg)]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${currentModuleProgress?.percentComplete ?? 0}%`,
                backgroundColor: "var(--unipod-blue)",
              }}
            />
          </div>
          <p className="mt-1 text-sm font-medium" style={{ color: "var(--unipod-blue)" }}>
            {currentModuleProgress?.percentComplete ?? 0}%
          </p>
        </div>

        {/* Your overall progress */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#374151]">Your overall progress</h3>
          <p className="mt-2 text-2xl font-bold text-[#171717]">Score: {overallPercent}%</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-[#6b7280]">
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDateRange(cohortStart, cohortEnd)}
          </div>
          <p className="mt-2 text-sm text-[#374151]">
            Overall: <strong>{overallPercent}%</strong>{" "}
            {allCompleted ? (
              <span className="font-medium" style={{ color: "var(--unipod-green)" }}>
                You&apos;re on track
              </span>
            ) : (
              <span className="font-medium" style={{ color: "var(--unipod-blue)" }}>
                In progress
              </span>
            )}
          </p>
          <Link
            href="/dashboard/trainee/learn"
            className="mt-3 inline-block rounded-lg border-2 px-3 py-1.5 text-sm font-medium"
            style={{ borderColor: "var(--unipod-blue)", color: "var(--unipod-blue)" }}
          >
            See progress details
          </Link>
        </div>

        {/* Your upcoming events */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#374151]">Your upcoming events</h3>
          <p className="mt-3 text-sm text-[#6b7280]">
            No upcoming events for now. Keep an eye on this space.
          </p>
          <Link
            href="/dashboard/trainee/planning"
            className="mt-3 inline-block rounded-lg border-2 px-3 py-1.5 text-sm font-medium"
            style={{ borderColor: "var(--unipod-blue)", color: "var(--unipod-blue)" }}
          >
            See my planning
          </Link>
        </div>
      </div>

      {/* Program + Greeting */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#6b7280]">{programName}</p>
          <p className="text-xs text-[#6b7280]">Average: {overallPercent}%</p>
        </div>
        <h2 className="text-2xl font-bold text-[#171717] md:text-3xl">
          {getGreeting()}, {firstName} 👋
        </h2>
      </div>

      {/* Module progress: horizontal step bar */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-[#374151]">Your journey</p>
        <div className="flex flex-wrap items-center gap-1">
          {modules.map((mod, i) => {
            const p = byModule[mod.id];
            const isCompleted = p?.status === "COMPLETED";
            const isCurrent =
              currentIndex === i || (currentIndex < 0 && i === modules.length - 1);
            return (
              <div key={mod.id} className="flex items-center">
                <Link
                  href={`/dashboard/trainee/learn/${mod.id}`}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 px-2 py-2 transition-colors ${
                    isCurrent ? "border-[var(--unipod-blue)] bg-[var(--unipod-blue-light)]" : "border-transparent hover:bg-[var(--sidebar-bg)]"
                  }`}
                  style={isCurrent ? { borderColor: "var(--unipod-blue)", backgroundColor: "var(--unipod-blue-light)" } : undefined}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                      isCompleted
                        ? "bg-[var(--unipod-green)] text-white"
                        : isCurrent
                          ? "text-white"
                          : "bg-[var(--sidebar-bg)] text-[#6b7280]"
                    }`}
                    style={
                      isCurrent && !isCompleted
                        ? { backgroundColor: "var(--unipod-blue)" }
                        : undefined
                    }
                  >
                    {isCompleted ? (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={`max-w-[4.5rem] truncate text-center text-xs ${
                      isCurrent ? "font-semibold" : ""
                    }`}
                    style={isCurrent ? { color: "var(--unipod-blue)" } : undefined}
                  >
                    {mod.title}
                  </span>
                </Link>
                {i < modules.length - 1 && (
                  <div
                    className="mx-0.5 h-0.5 w-3 shrink-0 rounded"
                    style={{ backgroundColor: isCompleted ? "var(--unipod-green)" : "var(--sidebar-bg)" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two main blocks: Continue + Deliverables */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Continue where you left off */}
        <div
          className="rounded-xl border-2 border-[#e5e7eb] bg-white p-5 shadow-sm"
          style={{ borderLeftWidth: "4px", borderLeftColor: "var(--unipod-blue)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--unipod-blue)" }}>
            Continue where you left off
          </p>
          {continueModule ? (
            <>
              <p className="mt-2 text-lg font-bold text-[#171717]">{continueModule.title}</p>
              <div
                className="mt-4 flex h-24 items-center justify-center rounded-lg text-center text-sm font-medium text-[#6b7280]"
                style={{ backgroundColor: "var(--unipod-blue-light)" }}
              >
                You can do it!
              </div>
              <Link
                href={`/dashboard/trainee/learn/${continueModule.id}`}
                className="mt-4 inline-block rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: "var(--unipod-blue)" }}
              >
                Continue
              </Link>
            </>
          ) : (
            <p className="mt-2 text-[#6b7280]">No module yet.</p>
          )}
        </div>

        {/* Your immediate deliverables */}
        <div
          className="rounded-xl border-2 border-[#e5e7eb] bg-white p-5 shadow-sm"
          style={{ borderLeftWidth: "4px", borderLeftColor: "var(--unipod-blue)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--unipod-blue)" }}>
            Your immediate deliverables
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold"
              style={{ borderColor: "var(--unipod-blue)", color: "var(--unipod-blue)" }}
            >
              {pendingDeliverables.length}
            </div>
            <div>
              <p className="text-sm text-[#6b7280]">In progress</p>
              <p className="font-semibold text-[#171717]">
                {pendingDeliverables.length} task{pendingDeliverables.length !== 1 ? "s" : ""} to complete
              </p>
            </div>
          </div>
          {pendingDeliverables.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {pendingDeliverables.slice(0, 4).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-[#374151]">{d.title}</span>
                  <Link
                    href={`/dashboard/trainee/learn/${programId}/${d.moduleId}/assignment/${d.id}`}
                    className="shrink-0 rounded-lg border-2 px-2 py-1 text-xs font-medium"
                    style={{ borderColor: "var(--unipod-blue)", color: "var(--unipod-blue)" }}
                  >
                    Start
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[#6b7280]">All caught up for now.</p>
          )}
          <Link
            href="/dashboard/trainee/learn"
            className="mt-4 inline-block rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--unipod-blue)" }}
          >
            Go to My courses
          </Link>
        </div>
      </div>
    </div>
  );
}
