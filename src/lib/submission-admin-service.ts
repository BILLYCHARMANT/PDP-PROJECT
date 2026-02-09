/**
 * Admin oversight: view all submissions, reassign to different mentor.
 * Admin cannot modify submission content; mentor approval logic is not bypassed.
 */
import { prisma } from "./prisma";
import { logAudit, AUDIT_ACTIONS } from "./audit-service";

export async function reassignSubmissionReviewer(
  submissionId: string,
  newReviewerId: string,
  adminId: string
): Promise<{ ok: boolean; error?: string }> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { assignment: { include: { module: true } } },
  });
  if (!submission) return { ok: false, error: "Submission not found" };
  const reviewer = await prisma.user.findUnique({
    where: { id: newReviewerId },
  });
  if (!reviewer || reviewer.role !== "MENTOR") {
    return { ok: false, error: "Reviewer must be a mentor" };
  }
  const previousReviewerId = submission.assignedReviewerId;
  await prisma.submission.update({
    where: { id: submissionId },
    data: { assignedReviewerId: newReviewerId },
  });
  await logAudit({
    actorId: adminId,
    action: AUDIT_ACTIONS.SUBMISSION_REASSIGN,
    entityType: "Submission",
    entityId: submissionId,
    details: {
      previousReviewerId: previousReviewerId ?? undefined,
      newReviewerId,
    },
  });
  return { ok: true };
}
