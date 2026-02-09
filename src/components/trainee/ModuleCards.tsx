import Link from "next/link";

type ModuleCardData = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessonCount: number;
  completedCount: number;
  assignmentCount: number;
  unlocked?: boolean;
};

export function ModuleCards({
  programId,
  programName,
  modules,
}: {
  programId: string;
  programName: string;
  modules: ModuleCardData[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">My learning</h1>
        <p className="mt-1 text-[#6b7280] dark:text-[#9ca3af]">
          {programName} — complete chapters and assignments in order. Finish one module before starting the next.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => {
          const unlocked = mod.unlocked !== false;
          const card = (
            <>
              <h2 className="font-semibold text-[#171717] dark:text-[#f9fafb]">
                {mod.title}
              </h2>
              {mod.description && (
                <p className="mt-2 line-clamp-3 text-sm text-[#6b7280] dark:text-[#9ca3af]">
                  {mod.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#6b7280] dark:text-[#9ca3af]">
                <span className="inline-flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {mod.completedCount}/{mod.lessonCount} chapters
                </span>
                {mod.assignmentCount > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {mod.assignmentCount} assignment{mod.assignmentCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--sidebar-bg)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width:
                      mod.lessonCount > 0
                        ? `${Math.round((mod.completedCount / mod.lessonCount) * 100)}%`
                        : "0%",
                    backgroundColor: "var(--unipod-blue)",
                  }}
                />
              </div>
              {unlocked ? (
                <p className="mt-2 text-sm font-medium" style={{ color: "var(--unipod-blue)" }}>
                  Open module →
                </p>
              ) : (
                <p className="mt-2 text-sm font-medium text-[#6b7280] dark:text-[#9ca3af]">
                  Complete the previous module first
                </p>
              )}
            </>
          );
          return (
            <div
              key={mod.id}
              className={`group flex flex-col rounded-xl border p-5 shadow-sm ${
                unlocked
                  ? "border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] transition-shadow hover:shadow-md"
                  : "border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827] opacity-90"
              }`}
            >
              {unlocked ? (
                <Link href={`/dashboard/trainee/learn/${programId}/${mod.id}`} className="block">
                  {card}
                </Link>
              ) : (
                card
              )}
            </div>
          );
        })}
      </div>
      {modules.length === 0 && (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 text-center text-[#6b7280]">
          No modules in this program yet.
        </div>
      )}
    </div>
  );
}
