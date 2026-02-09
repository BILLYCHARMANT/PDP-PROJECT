// GET /api/cohorts/[id] - Get cohort with enrollments
// PATCH /api/cohorts/[id] - Update cohort (admin)
// DELETE /api/cohorts/[id] - Delete cohort (admin)
// POST /api/cohorts/[id]/enroll - Enroll trainee(s) (admin)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  programId: z.string().optional().nullable(), // Allow changing program assignment
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  mentorId: z.string().optional().nullable(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const cohort = await prisma.cohort.findUnique({
      where: { id },
      include: {
        program: true,
        mentor: { select: { id: true, name: true, email: true } },
        enrollments: {
          include: {
            trainee: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });
    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    }
    // Mentor: only assigned cohorts; Trainee: only if enrolled
    if (session.user.role === "MENTOR" && cohort.mentorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (session.user.role === "TRAINEE") {
      const enrolled = cohort.enrollments.some(
        (e) => e.traineeId === session!.user!.id
      );
      if (!enrolled) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    return NextResponse.json(cohort);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.startDate !== undefined)
      data.startDate = parsed.data.startDate
        ? new Date(parsed.data.startDate)
        : null;
    if (parsed.data.endDate !== undefined)
      data.endDate = parsed.data.endDate
        ? new Date(parsed.data.endDate)
        : null;
    if (parsed.data.programId !== undefined)
      data.programId = parsed.data.programId ?? null;
    
    const cohort = await prisma.cohort.update({
      where: { id },
      data,
      include: {
        program: { select: { id: true, name: true } },
        mentor: { select: { id: true, name: true } },
      },
    });
    
    // If programId was changed, check if we need to update program status
    if (parsed.data.programId !== undefined && cohort.programId) {
      const { ensureProgramActiveIfHasCohort } = await import("@/lib/program-admin-service");
      await ensureProgramActiveIfHasCohort(cohort.programId);
    }
    
    return NextResponse.json(cohort);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    
    // Check if cohort exists
    const cohort = await prisma.cohort.findUnique({
      where: { id },
      include: {
        enrollments: { select: { id: true } },
      },
    });
    
    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    }
    
    // Warn if there are enrollments (but allow deletion - cascade will handle it)
    if (cohort.enrollments.length > 0) {
      // Still allow deletion - Prisma cascade will delete enrollments
    }
    
    // Delete the cohort (enrollments will be cascade deleted)
    await prisma.cohort.delete({
      where: { id },
    });
    
    // Log audit
    const { logAudit, AUDIT_ACTIONS } = await import("@/lib/audit-service");
    await logAudit({
      actorId: session.user.id,
      action: AUDIT_ACTIONS.COHORT_DELETE,
      entityType: "Cohort",
      entityId: id,
      details: { name: cohort.name, enrollmentCount: cohort.enrollments.length },
    });
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
