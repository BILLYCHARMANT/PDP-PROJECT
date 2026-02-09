import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTraineeProgramProgress } from "@/lib/progress-service";
import { LearnCourseShell } from "@/components/trainee/LearnCourseShell";

export default async function LearnProgramLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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
              modules: {
                orderBy: { order: "asc" },
                include: {
                  lessons: { orderBy: { order: "asc" } },
                  assignments: { orderBy: { order: "asc" } },
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
  const modules = program.modules;
  const allLessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));

  const accessed =
    allLessonIds.length > 0
      ? await prisma.lessonAccess.findMany({
          where: {
            traineeId: session.user.id,
            lessonId: { in: allLessonIds },
          },
          select: { lessonId: true },
        })
      : [];
  const accessedLessonIds = new Set(accessed.map((a) => a.lessonId));

  let progress: Awaited<ReturnType<typeof getTraineeProgramProgress>> | null = null;
  try {
    progress = await getTraineeProgramProgress(session.user.id, programId);
  } catch {
    // ignore
  }
  const overallPercent = progress?.overallPercent ?? 0;
  const moduleStatusById = new Map(progress?.modules.map((m) => [m.moduleId, m.status]) ?? []);

  const outline = {
    programName: program.name,
    programId,
    overallPercent,
    modules: modules.map((m, index) => {
      const prevCompleted =
        index === 0 || moduleStatusById.get(modules[index - 1]!.id) === "COMPLETED";
      return {
        id: m.id,
        title: m.title,
        description: m.description,
        order: m.order,
        unlocked: prevCompleted,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          order: l.order,
        })),
        assignments: m.assignments.map((a) => ({
          id: a.id,
          title: a.title,
          order: a.order,
        })),
      };
    }),
    accessedLessonIds: Array.from(accessedLessonIds),
  };

  return (
    <LearnCourseShell outline={outline} programId={programId}>
      {children}
    </LearnCourseShell>
  );
}
