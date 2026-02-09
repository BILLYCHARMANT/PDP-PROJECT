/**
 * Linear access for trainees: chapters in order, then assignment; next module only after previous completed.
 */
import { getTraineeProgramProgress } from "./progress-service";

/** Check if a module is unlocked (first module, or previous module completed). */
export async function isModuleUnlocked(
  traineeId: string,
  programId: string,
  moduleId: string
): Promise<boolean> {
  const progress = await getTraineeProgramProgress(traineeId, programId);
  const idx = progress.modules.findIndex((m) => m.moduleId === moduleId);
  if (idx < 0) return false;
  if (idx === 0) return true;
  const prev = progress.modules[idx - 1];
  return prev?.status === "COMPLETED";
}

/** Check if a lesson is unlocked (first in module, or previous lesson accessed). */
export function isLessonUnlocked(
  lessonId: string,
  orderedLessonIds: string[],
  accessedLessonIds: Set<string>
): boolean {
  const idx = orderedLessonIds.indexOf(lessonId);
  if (idx < 0) return false;
  if (idx === 0) return true;
  return accessedLessonIds.has(orderedLessonIds[idx - 1]!);
}

/** Check if assignment is unlocked (all lessons in module accessed). */
export function isAssignmentUnlocked(
  moduleLessonIds: string[],
  accessedLessonIds: Set<string>
): boolean {
  if (moduleLessonIds.length === 0) return true;
  return moduleLessonIds.every((id) => accessedLessonIds.has(id));
}
