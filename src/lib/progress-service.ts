// Progress tracking: module completion = all lessons accessed + mandatory assignment approved.
// Program completion = all modules completed. Admin does not manually change progress.
import { prisma } from "./prisma";
import { hasTraineeAccessedAllLessonsInModule } from "./lesson-access-service";

export async function revalidateProgress(
  traineeId: string,
  moduleId: string
): Promise<void> {
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      assignments: true,
      lessons: true,
      program: { include: { modules: true } },
    },
  });
  if (!module) return;

  const mandatoryAssignments = module.assignments.filter((a) => a.mandatory);
  const allAssignmentIds = module.assignments.map((a) => a.id);
  const approvedCount = await prisma.submission.count({
    where: {
      traineeId,
      assignmentId: { in: allAssignmentIds },
      status: "APPROVED",
    },
  });
  const totalAssignments = allAssignmentIds.length;
  const percentComplete =
    totalAssignments > 0
      ? Math.round((approvedCount / totalAssignments) * 100)
      : 0;

  const mandatoryApproved =
    mandatoryAssignments.length > 0 &&
    (await prisma.submission.count({
      where: {
        traineeId,
        assignmentId: { in: mandatoryAssignments.map((a) => a.id) },
        status: "APPROVED",
      },
    })) >= mandatoryAssignments.length;
  const allLessonsAccessed =
    await hasTraineeAccessedAllLessonsInModule(traineeId, moduleId);
  const moduleComplete =
    mandatoryApproved && allLessonsAccessed && module.lessons.length > 0;

  await prisma.progress.upsert({
    where: {
      traineeId_moduleId: { traineeId, moduleId },
    },
    create: {
      traineeId,
      moduleId,
      status: moduleComplete ? "COMPLETED" : "ACTIVE",
      percentComplete,
      completedAt: moduleComplete ? new Date() : undefined,
    },
    update: {
      status: moduleComplete ? "COMPLETED" : "ACTIVE",
      percentComplete,
      completedAt: moduleComplete ? new Date() : undefined,
    },
  });

  if (moduleComplete) {
    const program = module.program;
    const moduleIds = program.modules.map((m) => m.id);
    const completed = await prisma.progress.count({
      where: {
        traineeId,
        moduleId: { in: moduleIds },
        status: "COMPLETED",
      },
    });
    if (completed >= moduleIds.length) {
      // Program completed - certificate will be created on demand when they request it
      // (see certificates API)
    }
  }
}

/** Get trainee progress for a program (all modules) */
export async function getTraineeProgramProgress(
  traineeId: string,
  programId: string
) {
  const modules = await prisma.module.findMany({
    where: { programId },
    orderBy: { order: "asc" },
    include: {
      assignments: { select: { id: true } },
    },
  });
  const progressRecords = await prisma.progress.findMany({
    where: { traineeId, moduleId: { in: modules.map((m) => m.id) } },
  });
  const byModule = Object.fromEntries(
    progressRecords.map((p) => [p.moduleId, p])
  );
  let totalPercent = 0;
  const moduleProgress = modules.map((mod) => {
    const p = byModule[mod.id];
    const percent = p?.percentComplete ?? 0;
    totalPercent += percent;
    return {
      moduleId: mod.id,
      title: mod.title,
      status: p?.status ?? "ACTIVE",
      percentComplete: percent,
      completedAt: p?.completedAt ?? null,
    };
  });
  const overallPercent =
    modules.length > 0 ? Math.round(totalPercent / modules.length) : 0;
  const allCompleted = moduleProgress.every((m) => m.status === "COMPLETED");
  return {
    programId,
    overallPercent,
    allCompleted,
    modules: moduleProgress,
  };
}
