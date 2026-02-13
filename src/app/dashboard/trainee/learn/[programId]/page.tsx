import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTraineeProgramProgress } from "@/lib/progress-service";
import { ModuleCards } from "@/components/trainee/ModuleCards";

export default async function TraineeProgramLearnPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TRAINEE") redirect("/dashboard");
  const { programId } = await params;

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      traineeId: session.user.id,
      cohort: { programId },
    },
    include: {
      cohort: {
        include: {
          program: {
            include: {
              courses: {
                include: {
                  modules: {
                    orderBy: { order: "asc" },
                    include: {
                      lessons: { orderBy: { order: "asc" }, select: { id: true } },
                      assignments: { select: { id: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!enrollment) notFound();

  const program = enrollment.cohort.program;
  if (!program) notFound();
  const allModules = program.courses.flatMap((c) => c.modules);
  const allLessonIds = allModules.flatMap((m) => m.lessons.map((l) => l.id));

  const [accessed, progress] = await Promise.all([
    allLessonIds.length > 0
      ? prisma.lessonAccess.findMany({
          where: {
            traineeId: session.user.id,
            lessonId: { in: allLessonIds },
          },
          select: { lessonId: true },
        })
      : [],
    getTraineeProgramProgress(session.user.id, programId).catch(() => null),
  ]);
  const accessedSet = new Set(accessed.map((a) => a.lessonId));
  const moduleStatusById = new Map(
    progress?.modules.map((m) => [m.moduleId, m.status]) ?? []
  );

  const modules = allModules.map((m, index) => {
    const prevCompleted =
      index === 0 ||
      moduleStatusById.get(allModules[index - 1]!.id) === "COMPLETED";
    return {
      id: m.id,
      title: m.title,
      description: m.description ?? null,
      order: m.order,
      lessonCount: m.lessons.length,
      completedCount: m.lessons.filter((l) => accessedSet.has(l.id)).length,
      assignmentCount: m.assignments.length,
      unlocked: prevCompleted,
    };
  });

  return (
    <ModuleCards
      programId={programId}
      programName={program.name}
      modules={modules}
    />
  );
}
