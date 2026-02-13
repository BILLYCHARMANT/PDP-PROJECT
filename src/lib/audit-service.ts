/**
 * Audit logging for admin actions.
 * All admin mutations should log via this service.
 * Admin cannot modify trainee submission content; mentor approval logic is not bypassed.
 */
import { prisma } from "./prisma";

export const AUDIT_ACTIONS = {
  PROGRAM_CREATE: "PROGRAM_CREATE",
  PROGRAM_UPDATE: "PROGRAM_UPDATE",
  PROGRAM_ACTIVATE: "PROGRAM_ACTIVATE",
  PROGRAM_DELETE: "PROGRAM_DELETE",
  COURSE_DELETE: "COURSE_DELETE",
  COHORT_CREATE: "COHORT_CREATE",
  COHORT_UPDATE: "COHORT_UPDATE",
  COHORT_DELETE: "COHORT_DELETE",
  USER_DEACTIVATE: "USER_DEACTIVATE",
  USER_ACTIVATE: "USER_ACTIVATE",
  USER_REGISTER: "USER_REGISTER",
  ENROLLMENT_AT_RISK: "ENROLLMENT_AT_RISK",
  ENROLLMENT_EXTEND_DEADLINE: "ENROLLMENT_EXTEND_DEADLINE",
  SUBMISSION_REASSIGN: "SUBMISSION_REASSIGN",
  CERTIFICATE_APPROVE: "CERTIFICATE_APPROVE",
  CERTIFICATE_REVOKE: "CERTIFICATE_REVOKE",
  TRAINEE_ENROLL: "TRAINEE_ENROLL",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export async function logAudit(params: {
  actorId: string;
  action: AuditAction | string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      details: params.details ? JSON.stringify(params.details) : null,
    },
  });
}
