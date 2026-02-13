/**
 * Admin reporting: by program, cohort, date range, completion status.
 * Exports: CSV, PDF (data for report).
 */
import { ProgressStatus } from "@prisma/client";
import { prisma } from "./prisma";

export type ReportRow = {
  traineeId: string;
  traineeName: string;
  traineeEmail: string;
  programId: string;
  programName: string;
  cohortId: string;
  cohortName: string;
  enrolledAt: string;
  atRisk: boolean;
  progressPercent: number;
  completionState: "in_progress" | "completed";
  certificateId: string | null;
  certificateIssuedAt: string | null;
  certificateRevoked: boolean;
};

export async function getReportData(filters: {
  programId?: string;
  cohortId?: string;
  fromDate?: Date;
  toDate?: Date;
  completionStatus?: "all" | "in_progress" | "completed";
}): Promise<ReportRow[]> {
  const cohortWhere: Record<string, unknown> = {};
  if (filters.programId) cohortWhere.programId = filters.programId;
  if (filters.cohortId) cohortWhere.id = filters.cohortId;

  const enrollments = await prisma.enrollment.findMany({
    where: { cohort: cohortWhere },
    include: {
      trainee: { select: { id: true, name: true, email: true } },
      cohort: {
        include: {
          program: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (filters.fromDate || filters.toDate) {
    const from = filters.fromDate?.getTime();
    const to = filters.toDate?.getTime();
    const filtered = enrollments.filter((e) => {
      const t = new Date(e.enrolledAt).getTime();
      if (from && t < from) return false;
      if (to && t > to) return false;
      return true;
    });
    enrollments.length = 0;
    enrollments.push(...filtered);
  }

  const rows: ReportRow[] = [];
  for (const e of enrollments) {
    const programId = e.cohort.programId;
    const program = e.cohort.program;
    if (!programId || !program) continue;

    const progress = await prisma.progress.findMany({
      where: {
        traineeId: e.traineeId,
        module: { course: { programId } },
      },
    });
    const modules = await prisma.module.count({
      where: { course: { programId } },
    });
    const completed = progress.filter((p) => p.status === ProgressStatus.COMPLETED).length;
    const progressPercent = modules > 0 ? Math.round((completed / modules) * 100) : 0;
    const allCompleted = modules > 0 && completed >= modules;
    const cert = await prisma.certificate.findUnique({
      where: {
        traineeId_programId: { traineeId: e.traineeId, programId },
      },
    });

    const completionState: "in_progress" | "completed" = allCompleted ? "completed" : "in_progress";
    if (filters.completionStatus && filters.completionStatus !== "all") {
      if (filters.completionStatus !== completionState) continue;
    }

    rows.push({
      traineeId: e.trainee.id,
      traineeName: e.trainee.name,
      traineeEmail: e.trainee.email,
      programId: program.id,
      programName: program.name,
      cohortId: e.cohort.id,
      cohortName: e.cohort.name,
      enrolledAt: e.enrolledAt.toISOString(),
      atRisk: e.atRisk,
      progressPercent,
      completionState,
      certificateId: cert?.certificateId ?? null,
      certificateIssuedAt: cert?.issuedAt ? cert.issuedAt.toISOString() : null,
      certificateRevoked: !!cert?.revokedAt,
    });
  }
  return rows;
}

export function reportRowsToCsv(rows: ReportRow[]): string {
  const header = [
    "traineeId",
    "traineeName",
    "traineeEmail",
    "programId",
    "programName",
    "cohortId",
    "cohortName",
    "enrolledAt",
    "atRisk",
    "progressPercent",
    "completionState",
    "certificateId",
    "certificateIssuedAt",
    "certificateRevoked",
  ].join(",");
  const escape = (v: string | number | boolean | null) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n"))
      return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [header, ...rows.map((r) =>
    [
      r.traineeId,
      r.traineeName,
      r.traineeEmail,
      r.programId,
      r.programName,
      r.cohortId,
      r.cohortName,
      r.enrolledAt,
      r.atRisk,
      r.progressPercent,
      r.completionState,
      r.certificateId ?? "",
      r.certificateIssuedAt ?? "",
      r.certificateRevoked,
    ].map(escape).join(",")
  )];
  return lines.join("\n");
}
