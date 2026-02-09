"use client";

type Enrollment = {
  traineeId: string;
  atRisk: boolean;
};

type ProgressData = { traineeId: string; percentComplete: number; status: string };
type SubmissionData = { traineeId: string; status: string };

export function CohortStatsSummary({
  enrollments,
  progressData,
  submissionData,
  moduleCount,
}: {
  enrollments: Enrollment[];
  progressData: ProgressData[];
  submissionData: SubmissionData[];
  moduleCount: number;
}) {
  const traineeIds = enrollments.map((e) => e.traineeId);
  const atRiskCount = enrollments.filter((e) => e.atRisk).length;

  // Average progress across all trainees
  const progressByTrainee = traineeIds.map((tid) => {
    const list = progressData.filter((p) => p.traineeId === tid);
    const avg = list.length > 0
      ? Math.round(list.reduce((s, p) => s + p.percentComplete, 0) / list.length)
      : 0;
    const completed = list.filter((p) => p.status === "COMPLETED" || p.percentComplete === 100).length;
    return { traineeId: tid, avg, completed };
  });
  const cohortAvgProgress =
    progressByTrainee.length > 0
      ? Math.round(progressByTrainee.reduce((s, t) => s + t.avg, 0) / progressByTrainee.length)
      : 0;
  const totalModulesCompleted = progressByTrainee.reduce((s, t) => s + t.completed, 0);
  const maxPossible = enrollments.length * moduleCount;
  const modulesCompletionRate = maxPossible > 0 ? Math.round((totalModulesCompleted / maxPossible) * 100) : 0;

  // Submissions breakdown
  const pending = submissionData.filter((s) => s.status === "PENDING" || s.status === "RESUBMIT_REQUESTED").length;
  const approved = submissionData.filter((s) => s.status === "APPROVED").length;
  const rejected = submissionData.filter((s) => s.status === "REJECTED").length;
  const totalSubmissions = submissionData.length;

  const cards = [
    { label: "Trainees", value: enrollments.length, sub: "enrolled" },
    { label: "Cohort progress", value: `${cohortAvgProgress}%`, sub: "average completion" },
    { label: "Modules completed", value: totalModulesCompleted, sub: maxPossible > 0 ? `of ${maxPossible} (${modulesCompletionRate}%)` : "—" },
    { label: "Submissions", value: totalSubmissions, sub: `✓ ${approved} approved · ⏳ ${pending} pending · ✗ ${rejected} rejected` },
    { label: "At risk", value: atRiskCount, sub: "trainees flagged" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
            {card.label}
          </p>
          <p className="mt-2 text-2xl font-bold text-[#0f172a]">{card.value}</p>
          <p className="mt-0.5 text-sm text-[#64748b]">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
