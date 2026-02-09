/**
 * Admin program initialization and lifecycle.
 * - Program is stored as INACTIVE by default
 * - Program becomes ACTIVE only after at least one cohort is assigned to it
 * - When creating a course, admin/mentor selects which cohorts to assign it to
 */
import { prisma } from "./prisma";
import { logAudit, AUDIT_ACTIONS } from "./audit-service";

export async function createProgram(params: {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  duration?: string | null;
  skillOutcomes?: string | null;
  adminId: string;
}) {
  const program = await prisma.program.create({
    data: {
      name: params.name,
      description: params.description ?? null,
      imageUrl: params.imageUrl ?? null,
      duration: params.duration ?? null,
      skillOutcomes: params.skillOutcomes ?? null,
      status: "INACTIVE",
    },
  });
  await logAudit({
    actorId: params.adminId,
    action: AUDIT_ACTIONS.PROGRAM_CREATE,
    entityType: "Program",
    entityId: program.id,
    details: { name: program.name },
  });

  return program;
}

/** Assign a program to cohorts and unassign from others */
export async function assignProgramToCohorts(
  programId: string,
  cohortIds: string[],
  adminId: string
): Promise<void> {
  // First, unassign all cohorts currently assigned to this program
  await prisma.cohort.updateMany({
    where: { programId },
    data: { programId: null },
  });
  
  // Then assign to selected cohorts (even if empty array - that's valid, means unassign all)
  if (cohortIds.length > 0) {
    await prisma.cohort.updateMany({
      where: { id: { in: cohortIds } },
      data: { programId },
    });
    await ensureProgramActiveIfHasCohort(programId);
  } else {
    // If no cohorts selected, ensure program becomes INACTIVE if it has no cohorts
    const cohortCount = await prisma.cohort.count({
      where: { programId },
    });
    if (cohortCount === 0) {
      await prisma.program.update({
        where: { id: programId },
        data: { status: "INACTIVE" },
      });
    }
  }
  
  await logAudit({
    actorId: adminId,
    action: AUDIT_ACTIONS.PROGRAM_UPDATE,
    entityType: "Program",
    entityId: programId,
    details: { assignedToCohorts: cohortIds },
  });
}

/** Call when a cohort is created for a program: activate program if first cohort */
export async function ensureProgramActiveIfHasCohort(
  programId: string
): Promise<void> {
  const cohortCount = await prisma.cohort.count({
    where: { programId },
  });
  if (cohortCount > 0) {
    await prisma.program.update({
      where: { id: programId },
      data: { status: "ACTIVE" },
    });
  }
}

export async function setProgramActive(
  programId: string,
  adminId: string
): Promise<{ ok: boolean; error?: string }> {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: { cohorts: true },
  });
  if (!program) return { ok: false, error: "Program not found" };
  if (program.cohorts.length === 0) {
    return { ok: false, error: "Program cannot be activated until at least one cohort is created" };
  }
  await prisma.program.update({
    where: { id: programId },
    data: { status: "ACTIVE" },
  });
  await logAudit({
    actorId: adminId,
    action: AUDIT_ACTIONS.PROGRAM_ACTIVATE,
    entityType: "Program",
    entityId: programId,
  });
  return { ok: true };
}
