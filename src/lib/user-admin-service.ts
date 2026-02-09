/**
 * User management: activate/deactivate.
 * Deactivated users lose system access immediately (enforced in auth).
 */
import { prisma } from "./prisma";
import { logAudit, AUDIT_ACTIONS } from "./audit-service";

export async function setUserActive(
  userId: string,
  active: boolean,
  adminId: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "User not found" };
  if (user.id === adminId) {
    return { ok: false, error: "Cannot deactivate your own account" };
  }
  await prisma.user.update({
    where: { id: userId },
    data: { active },
  });
  await logAudit({
    actorId: adminId,
    action: active ? AUDIT_ACTIONS.USER_ACTIVATE : AUDIT_ACTIONS.USER_DEACTIVATE,
    entityType: "User",
    entityId: userId,
    details: { email: user.email, role: user.role },
  });
  return { ok: true };
}
