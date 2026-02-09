import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TraineeCourseList } from "@/components/trainee/TraineeCourseList";

export default async function TraineeLearnPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TRAINEE") redirect("/dashboard");

  const enrollments = await prisma.enrollment.findMany({
    where: { traineeId: session.user.id },
    include: {
      cohort: {
        include: {
          program: {
            include: {
              modules: { select: { id: true } },
            },
          },
        },
      },
    },
  });
  if (enrollments.length === 0) redirect("/dashboard");

  // Unique programs (courses) the trainee has access to via their enrollments
  const programIds = [...new Set(enrollments.map((e) => e.cohort.programId))];
  const programs = await prisma.program.findMany({
    where: { id: { in: programIds } },
    include: { modules: { select: { id: true } } },
    orderBy: { name: "asc" },
  });

  const courses = programs.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    imageUrl: p.imageUrl ?? null,
    duration: p.duration ?? null,
    moduleCount: p.modules.length,
  }));

  return (
    <div
      className="min-h-full rounded-xl p-6"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      <TraineeCourseList courses={courses} />
    </div>
  );
}
