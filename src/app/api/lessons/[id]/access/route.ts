// POST /api/lessons/[id]/access - Record lesson access (trainee only). Used for completion logic.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recordLessonAccess } from "@/lib/lesson-access-service";
import { prisma } from "@/lib/prisma";
import { canTraineeAccessCohortContent } from "@/lib/cohort-admin-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TRAINEE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: lessonId } = await params;
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: { include: { program: true } } } } },
    });
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }
    const programId = lesson.module.course?.programId;
    if (!programId) {
      return NextResponse.json({ error: "Lesson not in a program" }, { status: 400 });
    }
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        traineeId: session.user.id,
        cohort: { programId },
      },
      include: { cohort: true },
    });
    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled in this program" }, { status: 403 });
    }
    const access = await canTraineeAccessCohortContent(
      session.user.id,
      enrollment.cohortId
    );
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.reason ?? "Access not allowed" },
        { status: 403 }
      );
    }
    await recordLessonAccess(session.user.id, lessonId);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
