/**
 * Lesson completion = trainee interaction (first access).
 * Module completion requires: all lessons accessed + mandatory assignment approved.
 */
import { prisma } from "./prisma";

export async function recordLessonAccess(
  traineeId: string,
  lessonId: string
): Promise<void> {
  await prisma.lessonAccess.upsert({
    where: {
      traineeId_lessonId: { traineeId, lessonId },
    },
    create: { traineeId, lessonId },
    update: {},
  });
}

export async function hasTraineeAccessedAllLessonsInModule(
  traineeId: string,
  moduleId: string
): Promise<boolean> {
  const module_ = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { lessons: true },
  });
  if (!module_ || module_.lessons.length === 0) return false;
  const accessed = await prisma.lessonAccess.count({
    where: {
      traineeId,
      lessonId: { in: module_.lessons.map((l) => l.id) },
    },
  });
  return accessed >= module_.lessons.length;
}
