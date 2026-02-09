// GET /api/cohorts - List cohorts
// POST /api/cohorts - Create cohort (admin); program becomes ACTIVE when first cohort created
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCohort } from "@/lib/cohort-admin-service";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  programId: z.string().optional(), // Optional: cohorts can be created without a program
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  mentorId: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("programId");

    if (session.user.role === "ADMIN") {
      const where = programId ? { programId } : {};
      const cohorts = await prisma.cohort.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          program: { select: { id: true, name: true } },
          mentor: { select: { id: true, name: true, email: true } },
          _count: { select: { enrollments: true } },
        },
      });
      return NextResponse.json(cohorts);
    }
    if (session.user.role === "MENTOR") {
      const cohorts = await prisma.cohort.findMany({
        where: { mentorId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          program: { select: { id: true, name: true } },
          _count: { select: { enrollments: true } },
        },
      });
      return NextResponse.json(cohorts);
    }
    // TRAINEE: enrolled cohorts only
    const enrollments = await prisma.enrollment.findMany({
      where: { traineeId: session.user.id },
      include: {
        cohort: {
          include: {
            program: { select: { id: true, name: true } },
            mentor: { select: { id: true, name: true } },
          },
        },
      },
    });
    const cohorts = enrollments.map((e) => e.cohort);
    return NextResponse.json(cohorts);
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
    if (!session?.user || session.user.role !== "ADMIN") {
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
    const cohort = await createCohort({
      name: parsed.data.name,
      programId: parsed.data.programId ?? null,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      mentorId: parsed.data.mentorId ?? null,
      adminId: session.user.id,
    });
    const withRelations = await prisma.cohort.findUnique({
      where: { id: cohort.id },
      include: {
        program: { select: { id: true, name: true } },
        mentor: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(withRelations ?? cohort);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
