import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AssignmentCard } from "@/components/trainee/AssignmentCard";

export default async function TraineeAssignmentPage({
  params,
}: {
  params: Promise<{ programId: string; moduleId: string; assignmentId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TRAINEE") redirect("/dashboard");
  const { programId, moduleId, assignmentId } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      module: {
        include: { course: { include: { program: { select: { id: true, name: true } } } } },
      },
    },
  });
  if (!assignment || assignment.moduleId !== moduleId || assignment.module.course?.programId !== programId) notFound();

  const course = assignment.module.course;
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

  const moduleWithLessons = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { lessons: { orderBy: { order: "asc" }, select: { id: true } } },
  });
  if (moduleWithLessons && moduleWithLessons.lessons.length > 0) {
    const lessonIds = moduleWithLessons.lessons.map((l) => l.id);
    const accessed = await prisma.lessonAccess.count({
      where: {
        traineeId: session.user.id,
        lessonId: { in: lessonIds },
      },
    });
    if (accessed < lessonIds.length) {
      redirect(`/dashboard/trainee/learn/${programId}/${moduleId}`);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <nav className="flex items-center gap-2 text-sm text-[#6b7280]">
        <Link href="/dashboard/trainee/learn" className="hover:text-[var(--unipod-blue)]">
          Courses
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/dashboard/trainee/learn/${programId}`} className="hover:text-[var(--unipod-blue)]">
          {assignment.module.course?.program?.name ?? "Course"}
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/dashboard/trainee/learn/${programId}/${moduleId}`} className="hover:text-[var(--unipod-blue)]">
          Module
        </Link>
      </nav>
      <h1 className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">Assignment</h1>
      <AssignmentCard
        assignment={{
          id: assignment.id,
          title: assignment.title,
          description: assignment.description ?? null,
          instructions: assignment.instructions ?? null,
          dueDate: assignment.dueDate,
        }}
        traineeId={session.user.id}
      />
    </div>
  );
}
