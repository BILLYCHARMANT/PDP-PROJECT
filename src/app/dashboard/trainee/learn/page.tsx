import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TraineeCourseList } from "@/components/trainee/TraineeCourseList";

export default async function TraineeLearnPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TRAINEE") redirect("/dashboard");

  // First check if trainee has any enrollments (simple count query)
  const enrollmentCount = await prisma.enrollment.count({
    where: { traineeId: session.user.id },
  });

  // If no enrollments, return empty array to show empty state
  if (enrollmentCount === 0) {
    return (
      <div
        className="min-h-full rounded-xl p-6"
        style={{ backgroundColor: "var(--sidebar-bg)" }}
      >
        <TraineeCourseList courses={[]} />
      </div>
    );
  }

  // Only fetch full enrollment data if enrollments exist
  const enrollments = await prisma.enrollment.findMany({
    where: { traineeId: session.user.id },
    include: { cohort: { select: { programId: true } } },
  });

  const programIds = [...new Set(enrollments.map((e) => e.cohort.programId).filter((id): id is string => id != null))];

  const programs = await prisma.program.findMany({
    where: { id: { in: programIds } },
    include: { courses: { include: { modules: { select: { id: true } } } } },
    orderBy: { name: "asc" },
  });

  const courses = programs.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    imageUrl: p.imageUrl ?? null,
    duration: p.duration ?? null,
    moduleCount: p.courses.reduce((sum, c) => sum + c.modules.length, 0),
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
