/**
 * Admin: flag trainees as At Risk, extend deadlines.
 * Does not modify scores or progress.
 */
import { prisma } from "./prisma";
import { logAudit, AUDIT_ACTIONS } from "./audit-service";

export async function setEnrollmentAtRisk(
  enrollmentId: string,
  atRisk: boolean,
  adminId: string
): Promise<{ ok: boolean; error?: string }> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
  });
  if (!enrollment) return { ok: false, error: "Enrollment not found" };
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { atRisk },
  });
  await logAudit({
    actorId: adminId,
    action: AUDIT_ACTIONS.ENROLLMENT_AT_RISK,
    entityType: "Enrollment",
    entityId: enrollmentId,
    details: { traineeId: enrollment.traineeId, atRisk },
  });
  return { ok: true };
}

export async function extendEnrollmentDeadline(
  enrollmentId: string,
  extendedEndDate: Date,
  adminId: string
): Promise<{ ok: boolean; error?: string }> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { cohort: true },
  });
  if (!enrollment) return { ok: false, error: "Enrollment not found" };
  const cohortEnd = enrollment.cohort.endDate;
  if (cohortEnd && extendedEndDate < cohortEnd) {
    return { ok: false, error: "Extended end date must be after cohort end date" };
  }
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { extendedEndDate },
  });
  await logAudit({
    actorId: adminId,
    action: AUDIT_ACTIONS.ENROLLMENT_EXTEND_DEADLINE,
    entityType: "Enrollment",
    entityId: enrollmentId,
    details: { extendedEndDate: extendedEndDate.toISOString() },
  });
  return { ok: true };
}
