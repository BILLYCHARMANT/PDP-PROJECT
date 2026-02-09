/**
 * Certificate control: eligibility, admin approval, revocation.
 * Certificate data is locked after issuance; revocation only sets revokedAt and reason.
 */
import { prisma } from "./prisma";
import { getTraineeProgramProgress } from "./progress-service";
import { logAudit, AUDIT_ACTIONS } from "./audit-service";

export async function getCertificateEligibility(
  traineeId: string,
  programId: string
): Promise<{
  eligible: boolean;
  reason?: string;
  progress?: { overallPercent: number; allCompleted: boolean };
 }> {
  const progress = await getTraineeProgramProgress(traineeId, programId);
  if (progress.allCompleted) {
    return { eligible: true, progress };
  }
  return {
    eligible: false,
    reason: "All modules must be completed",
    progress: {
      overallPercent: progress.overallPercent,
      allCompleted: progress.allCompleted,
    },
  };
}

export async function revokeCertificate(
  certificateId: string,
  reason: string,
  adminId: string
): Promise<{ ok: boolean; error?: string }> {
  const cert = await prisma.certificate.findUnique({
    where: { certificateId },
  });
  if (!cert) return { ok: false, error: "Certificate not found" };
  if (cert.revokedAt) return { ok: false, error: "Certificate already revoked" };
  await prisma.certificate.update({
    where: { certificateId },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
  await logAudit({
    actorId: adminId,
    action: AUDIT_ACTIONS.CERTIFICATE_REVOKE,
    entityType: "Certificate",
    entityId: cert.id,
    details: { certificateId, reason },
  });
  return { ok: true };
}

export async function approveCertificateIssuance(
  traineeId: string,
  programId: string,
  adminId: string
): Promise<{ ok: boolean; error?: string; certificateId?: string }> {
  const eligibility = await getCertificateEligibility(traineeId, programId);
  if (!eligibility.eligible) {
    return { ok: false, error: eligibility.reason ?? "Not eligible" };
  }
  const existing = await prisma.certificate.findUnique({
    where: { traineeId_programId: { traineeId, programId } },
  });
  if (existing) {
    if (existing.revokedAt) return { ok: false, error: "Certificate was revoked" };
    return { ok: true, certificateId: existing.certificateId };
  }
  const { getOrCreateCertificate } = await import("./certificate-service");
  const result = await getOrCreateCertificate(traineeId, programId, {
    approvedById: adminId,
    autoIssued: false,
  });
  await logAudit({
    actorId: adminId,
    action: AUDIT_ACTIONS.CERTIFICATE_APPROVE,
    entityType: "Certificate",
    entityId: result.certificateId,
    details: { traineeId, programId },
  });
  return { ok: true, certificateId: result.certificateId };
}
