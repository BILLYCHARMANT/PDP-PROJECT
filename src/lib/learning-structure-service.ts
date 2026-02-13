/**
 * Learning structure validation and rules.
 * Program → Modules → Lessons → Assignment
 * - Module must contain at least one lesson
 * - Each module must have exactly one mandatory assignment
 * - Assignment approval is required for module completion
 */
import { prisma } from "./prisma";

export type ModuleStructureStatus = "complete" | "incomplete";

export interface ModuleValidation {
  moduleId: string;
  title: string;
  status: ModuleStructureStatus;
  hasLessons: boolean;
  lessonCount: number;
  mandatoryAssignmentCount: number;
  errors: string[];
}

export async function validateModule(moduleId: string): Promise<ModuleValidation> {
  const module_ = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      lessons: true,
      assignments: { where: { mandatory: true } },
    },
  });
  if (!module_) {
    return {
      moduleId,
      title: "",
      status: "incomplete",
      hasLessons: false,
      lessonCount: 0,
      mandatoryAssignmentCount: 0,
      errors: ["Module not found"],
    };
  }
  const lessonCount = module_.lessons.length;
  const mandatoryCount = module_.assignments.length;
  const hasLessons = lessonCount >= 1;
  const hasExactlyOneMandatory = mandatoryCount === 1;
  const errors: string[] = [];
  if (!hasLessons) errors.push("Module must contain at least one lesson");
  if (!hasExactlyOneMandatory) {
    if (mandatoryCount === 0) errors.push("Module must have exactly one mandatory assignment");
    else errors.push("Module must have exactly one mandatory assignment (found " + mandatoryCount + ")");
  }
  const status: ModuleStructureStatus =
    hasLessons && hasExactlyOneMandatory ? "complete" : "incomplete";
  return {
    moduleId: module_.id,
    title: module_.title,
    status,
    hasLessons,
    lessonCount,
    mandatoryAssignmentCount: mandatoryCount,
    errors,
  };
}

export async function validateProgramStructure(
  programId: string
): Promise<{ valid: boolean; modules: ModuleValidation[] }> {
  const modules = await prisma.module.findMany({
    where: { course: { programId } },
    orderBy: { order: "asc" },
  });
  const results: ModuleValidation[] = [];
  for (const m of modules) {
    results.push(await validateModule(m.id));
  }
  const valid = results.every((r) => r.status === "complete");
  return { valid, modules: results };
}
