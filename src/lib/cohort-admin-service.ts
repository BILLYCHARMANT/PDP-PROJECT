/**
 * Cohort creation and linking.
 * - Cohort inherits learning structure from program
 * - Progress tracking starts at cohort start date
 * - Trainees cannot access content before cohort start (enforced at access time)
 */
import { prisma } from "./prisma";
import { ensureProgramActiveIfHasCohort } from "./program-admin-service";
import { logAudit, AUDIT_ACTIONS } from "./audit-service";

export async function createCohort(params: {
  name: string;
  programId?: string | null; // Optional: cohorts can be created without a program, then assigned later
  startDate?: Date | null;
  endDate?: Date | null;
  mentorId?: string | null;
  adminId: string;
}) {
  const cohort = await prisma.cohort.create({
    data: {
      name: params.name,
      programId: params.programId ?? null,
      startDate: params.startDate ?? null,
      endDate: params.endDate ?? null,
      mentorId: params.mentorId ?? null,
    },
  });
  // Only activate program if programId was provided
  if (params.programId) {
    await ensureProgramActiveIfHasCohort(params.programId);
  }
  await logAudit({
    actorId: params.adminId,
    action: AUDIT_ACTIONS.COHORT_CREATE,
    entityType: "Cohort",
    entityId: cohort.id,
    details: { name: cohort.name, programId: params.programId ?? null },
  });
  return cohort;
}

/**
 * Check if a trainee can access program content for a cohort (based on start date and extended end date).
 * Used by progress/lesson/submission flows.
 */
export async function canTraineeAccessCohortContent(
  traineeId: string,
  cohortId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { traineeId_cohortId: { traineeId, cohortId } },
    include: { cohort: true },
  });
  if (!enrollment) return { allowed: false, reason: "Not enrolled" };
  const now = new Date();
  const start = enrollment.cohort.startDate;
  const end = enrollment.extendedEndDate ?? enrollment.cohort.endDate;
  if (start && now < start) {
    return { allowed: false, reason: "Cohort has not started yet" };
  }
  if (end && now > end) {
    return { allowed: false, reason: "Cohort has ended" };
  }
  return { allowed: true };
}
