import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LessonViewContent } from "@/components/trainee/LessonViewContent";

export default async function TraineeLessonPage({
  params,
}: {
  params: Promise<{ programId: string; moduleId: string; lessonId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TRAINEE") redirect("/dashboard");
  const { programId, moduleId, lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: { include: { program: { select: { id: true, name: true } } } },
          lessons: { orderBy: { order: "asc" }, select: { id: true, order: true } },
        },
      },
    },
  });
  if (!lesson || lesson.moduleId !== moduleId || lesson.module.course?.programId !== programId) notFound();

  const course = lesson.module.course;
  if (course) {
    const now = new Date();
    if (course.startDate != null && now < course.startDate) notFound();
    if (course.endDate != null && now > course.endDate) notFound();
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      traineeId: session.user.id,
      cohort: { programId },
    },
  });
  if (!enrollment) notFound();

  const orderedLessonIds = lesson.module.lessons.map((l) => l.id);
  const accessedInModule = await prisma.lessonAccess.findMany({
    where: {
      traineeId: session.user.id,
      lessonId: { in: orderedLessonIds },
    },
    select: { lessonId: true },
  });
  const accessedSet = new Set(accessedInModule.map((a) => a.lessonId));
  const lessonIndex = orderedLessonIds.indexOf(lessonId);
  const canAccess =
    lessonIndex >= 0 &&
    (lessonIndex === 0 || accessedSet.has(orderedLessonIds[lessonIndex - 1]!));
  if (!canAccess) {
    redirect(`/dashboard/trainee/learn/${programId}/${lesson.moduleId}`);
  }

  const accessed = await prisma.lessonAccess.findUnique({
    where: {
      traineeId_lessonId: { traineeId: session.user.id, lessonId },
    },
  });

  const idx = lesson.module.lessons.findIndex((l) => l.id === lessonId);
  const prevLesson = idx > 0 ? lesson.module.lessons[idx - 1] : null;
  const nextLesson = idx >= 0 && idx < lesson.module.lessons.length - 1 ? lesson.module.lessons[idx + 1] : null;

  return (
    <LessonViewContent
      lesson={{
        id: lesson.id,
        title: lesson.title,
        content: lesson.content,
        videoUrl: lesson.videoUrl,
        resourceUrl: lesson.resourceUrl,
      }}
      programId={programId}
      moduleId={moduleId}
      programName={lesson.module.course?.program?.name ?? "Course"}
      alreadyCompleted={!!accessed}
      prevLessonId={prevLesson?.id ?? null}
      nextLessonId={nextLesson?.id ?? null}
    />
  );
}
