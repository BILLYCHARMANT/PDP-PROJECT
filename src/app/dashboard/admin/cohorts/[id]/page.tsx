import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CohortDetailSections } from "@/components/admin/CohortDetailSections";

export default async function CohortDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");
  const { id } = await params;
  const cohort = await prisma.cohort.findUnique({
    where: { id },
    include: {
      program: {
        include: {
          courses: { include: { modules: { select: { id: true } } } },
        },
      },
      mentor: { select: { id: true, name: true, email: true } },
      enrollments: {
        include: {
          trainee: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              active: true,
              createdAt: true,
              imageUrl: true,
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
      },
    },
  });
  if (!cohort) notFound();

  const traineeIds = cohort.enrollments.map((e) => e.traineeId);
  const moduleIds =
    cohort.program?.courses.flatMap((c) => c.modules.map((m) => m.id)) ?? [];

  const [programs, courses, mentors, trainees, progressData, submissionData] = await Promise.all([
    prisma.program.findMany({ orderBy: { name: "asc" } }),
    prisma.course.findMany({
      select: { id: true, name: true, programId: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "MENTOR" },
      select: { id: true, name: true, email: true },
    }),
    prisma.user.findMany({
      where: { role: "TRAINEE" },
      select: { id: true, name: true, email: true },
    }),
    traineeIds.length > 0 && moduleIds.length > 0
      ? prisma.progress.findMany({
          where: {
            traineeId: { in: traineeIds },
            moduleId: { in: moduleIds },
          },
          select: {
            traineeId: true,
            moduleId: true,
            percentComplete: true,
            status: true,
            completedAt: true,
          },
        })
      : Promise.resolve([]),
    traineeIds.length > 0
      ? prisma.submission.findMany({
          where: {
            traineeId: { in: traineeIds },
            assignment: {
              module: {
                course: {
                  programId: cohort.programId ?? undefined,
                },
              },
            },
          },
          select: {
            traineeId: true,
            status: true,
            submittedAt: true,
            reviewedAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div
      className="min-h-full rounded-xl p-6 space-y-8"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      <Link
        href="/dashboard/admin/cohorts"
        className="text-sm font-medium text-[#6b7280] hover:text-[#171717]"
      >
        ← Cohorts
      </Link>

      <CohortDetailSections
        cohortId={cohort.id}
        cohortName={cohort.name}
        assignedProgram={cohort.program ? { id: cohort.program.id, name: cohort.program.name } : null}
        assignedCourseIds={cohort.program?.courses.map((c) => c.id) ?? []}
        assignedCourses={cohort.program?.courses.map((c) => ({ id: c.id, name: c.name })) ?? []}
        mentor={cohort.mentor}
        enrollments={cohort.enrollments}
        progressData={progressData}
        submissionData={submissionData}
        moduleCount={moduleIds.length}
        programs={programs}
        courses={courses}
        mentors={mentors}
        trainees={trainees}
        initial={{
          name: cohort.name,
          programId: cohort.programId,
          mentorId: cohort.mentorId,
        }}
      />
    </div>
  );
}
