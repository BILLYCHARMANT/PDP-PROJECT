import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/trainee/planning-context
 * Returns the logged-in trainee's name, cohort, mentors, and programs/modules/lessons for the schedule form.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TRAINEE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { traineeId: session.user.id },
      select: {
        cohort: {
          select: {
            name: true,
            mentorId: true,
            mentor: { select: { id: true, name: true } },
            programId: true,
            program: { select: { id: true, name: true } },
          },
        },
      },
    });

    const firstCohort = enrollments[0]?.cohort;
    const cohortName = firstCohort?.name ?? "—";
    const mentors = firstCohort?.mentor
      ? [{ id: firstCohort.mentor.id, name: firstCohort.mentor.name }]
      : [];

    const programIds = [
      ...new Set(
        enrollments
          .map((e) => e.cohort?.programId)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    const programs =
      programIds.length === 0
        ? []
        : await prisma.program.findMany({
            where: { id: { in: programIds } },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          });

    const modulesWithLessons =
      programIds.length === 0
        ? []
        : await prisma.module.findMany({
            where: { course: { programId: { in: programIds } } },
            select: {
              id: true,
              title: true,
              course: { select: { programId: true } },
              lessons: { select: { id: true, title: true, order: true }, orderBy: { order: "asc" } },
            },
            orderBy: { order: "asc" },
          });

    return NextResponse.json({
      traineeName: session.user.name ?? "",
      cohortName,
      mentors,
      programs,
      modules: modulesWithLessons,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
