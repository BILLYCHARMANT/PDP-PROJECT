import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const LOCATIONS = [
  "Green tech lab",
  "Design lab",
  "Rapid prototyping lab",
  "Textile lab",
  "VR and Gaming lab",
  "Electrical and Electronics lab",
  "Food and agri-tech lab",
  "Music and studio lab",
  "Wood workshop lab",
  "Metal workshop lab",
  "Pitching area",
  "Cafeteria",
] as const;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TRAINEE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      date,
      startTime,
      endTime,
      eventType,
      requestCoffee,
      mentorId,
      location,
      equipmentNeeded,
      teamMembers,
      description,
    } = body;

    if (!date || typeof date !== "string") {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }
    const dateObj = new Date(date);
    if (Number.isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const today = new Date().toISOString().slice(0, 10);
    if (date.slice(0, 10) < today) {
      return NextResponse.json({ error: "Cannot schedule an event in the past" }, { status: 400 });
    }

    if (!eventType || !["LAB_WORKSHOP", "MENTOR_MEETING", "COURSE_SCHEDULE"].includes(eventType)) {
      return NextResponse.json({ error: "eventType must be LAB_WORKSHOP, MENTOR_MEETING, or COURSE_SCHEDULE" }, { status: 400 });
    }

    if (!location || typeof location !== "string" || !LOCATIONS.includes(location)) {
      return NextResponse.json({ error: "location is required and must be one of the allowed locations" }, { status: 400 });
    }

    const { moduleId: bodyModuleId, lessonId: bodyLessonId } = body;
    let resolvedMentorId: string | null = null;
    let resolvedModuleId: string | null = null;
    let resolvedLessonId: string | null = null;

    const enrollments = await prisma.enrollment.findMany({
      where: { traineeId: session.user.id },
      select: { cohort: { select: { mentorId: true, programId: true } } },
    });
    const firstCohort = enrollments[0]?.cohort;
    const cohortMentorId = firstCohort?.mentorId;
    const traineeProgramIds = enrollments
      .map((e) => e.cohort?.programId)
      .filter((id): id is string => Boolean(id));

    if (eventType === "MENTOR_MEETING") {
      if (!mentorId || typeof mentorId !== "string") {
        return NextResponse.json({ error: "Mentor is required for technical support (meet with mentor)" }, { status: 400 });
      }
      if (!cohortMentorId || cohortMentorId !== mentorId) {
        return NextResponse.json({ error: "Selected mentor must be assigned to your cohort" }, { status: 400 });
      }
      resolvedMentorId = mentorId;
    }

    if (eventType === "COURSE_SCHEDULE") {
      if (traineeProgramIds.length === 0) {
        return NextResponse.json({ error: "You must be enrolled in a course to schedule course content" }, { status: 400 });
      }
      if (!bodyModuleId || typeof bodyModuleId !== "string" || !bodyLessonId || typeof bodyLessonId !== "string") {
        return NextResponse.json({ error: "Module and chapter (lesson) are required for course schedule" }, { status: 400 });
      }
      const module = await prisma.module.findFirst({
        where: { id: bodyModuleId, programId: { in: traineeProgramIds } },
        select: { id: true },
      });
      if (!module) {
        return NextResponse.json({ error: "Module must belong to your course" }, { status: 400 });
      }
      const lesson = await prisma.lesson.findFirst({
        where: { id: bodyLessonId, moduleId: bodyModuleId },
        select: { id: true },
      });
      if (!lesson) {
        return NextResponse.json({ error: "Chapter must belong to the selected module" }, { status: 400 });
      }
      resolvedModuleId = bodyModuleId;
      resolvedLessonId = bodyLessonId;
      resolvedMentorId = cohortMentorId ?? null;
    }

    const event = await prisma.traineeScheduledEvent.create({
      data: {
        traineeId: session.user.id,
        mentorId: resolvedMentorId,
        date: dateObj,
        startTime: typeof startTime === "string" ? startTime : null,
        endTime: typeof endTime === "string" ? endTime : null,
        eventType,
        requestCoffee: Boolean(requestCoffee),
        location,
        equipmentNeeded: typeof equipmentNeeded === "string" ? equipmentNeeded : null,
        teamMembers: typeof teamMembers === "string" ? teamMembers : null,
        description: typeof description === "string" ? description : null,
        moduleId: resolvedModuleId,
        lessonId: resolvedLessonId,
      },
    });

    revalidatePath("/dashboard/trainee/planning");
    return NextResponse.json(event);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
