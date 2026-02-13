// GET /api/modules?courseId= - List modules (optionally by course)
// POST /api/modules - Create module (admin)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  inspiringQuotes: z.string().optional(),
  order: z.number().int().min(0).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const where = courseId ? { courseId } : {};
    const modules = await prisma.module.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        course: { select: { id: true, name: true } },
        lessons: { orderBy: { order: "asc" }, select: { id: true, title: true } },
        assignments: {
          orderBy: { order: "asc" },
          select: { id: true, title: true },
        },
      },
    });
    return NextResponse.json(modules);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MENTOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { startDate: startDateStr, endDate: endDateStr, ...rest } = parsed.data;
    const data = {
      ...rest,
      startDate: startDateStr ? new Date(startDateStr) : undefined,
      endDate: endDateStr ? new Date(endDateStr) : undefined,
    };
    const module_ = await prisma.module.create({
      data,
      include: { course: { select: { id: true, name: true } } },
    });

    // Assign module to all eligible students: enrollees in cohorts assigned to the course's program (active trainees)
    const course = await prisma.course.findUnique({
      where: { id: parsed.data.courseId },
      include: { program: { include: { cohorts: { select: { id: true } } } } },
    });
    
    if (course?.program) {
      const cohortIds = course.program.cohorts.map((c) => c.id);
      const enrollments = await prisma.enrollment.findMany({
        where: { cohortId: { in: cohortIds } },
        include: { trainee: { select: { id: true, active: true } } },
      });
      for (const en of enrollments) {
        if (!en.trainee.active) continue;
        await prisma.progress.upsert({
          where: {
            traineeId_moduleId: { traineeId: en.traineeId, moduleId: module_.id },
          },
          create: {
            traineeId: en.traineeId,
            moduleId: module_.id,
            status: "ACTIVE",
            percentComplete: 0,
          },
          update: {},
        });
      }
    }

    return NextResponse.json(module_);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
