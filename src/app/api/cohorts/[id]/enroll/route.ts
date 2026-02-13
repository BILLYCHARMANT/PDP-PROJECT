// POST /api/cohorts/[id]/enroll - Enroll one or multiple trainees (admin)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  traineeIds: z.array(z.string().min(1)).min(1),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: cohortId } = await params;
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        program: { include: { courses: { include: { modules: true } } } },
      },
    });
    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    }
    const programModules =
      cohort.program?.courses.flatMap((c) => c.modules) ?? [];
    const created: string[] = [];
    for (const traineeId of parsed.data.traineeIds) {
      const trainee = await prisma.user.findUnique({
        where: { id: traineeId },
      });
      if (!trainee || trainee.role !== "TRAINEE") continue;
      try {
        await prisma.enrollment.upsert({
          where: {
            traineeId_cohortId: { traineeId, cohortId },
          },
          create: { traineeId, cohortId },
          update: {},
        });
        created.push(traineeId);
        // Initialize progress for each module in the program's courses
        for (const mod of programModules) {
          await prisma.progress.upsert({
            where: {
              traineeId_moduleId: { traineeId, moduleId: mod.id },
            },
            create: {
              traineeId,
              moduleId: mod.id,
              status: "ACTIVE",
              percentComplete: 0,
            },
            update: {},
          });
        }
      } catch {
        // skip duplicate
      }
    }
    return NextResponse.json({ enrolled: created });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
