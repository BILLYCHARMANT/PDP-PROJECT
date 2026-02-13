// GET /api/programs/[id] - Get single program with modules/lessons/assignments
// PATCH /api/programs/[id] - Update program (admin)
// DELETE /api/programs/[id] - Delete program (admin)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit-service";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional().nullable().or(z.literal("")),
  duration: z.string().optional(),
  skillOutcomes: z.string().optional(),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).optional().nullable(),
  cohortIds: z.array(z.string()).optional(), // Assign course to cohorts
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
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        cohorts: true,
        courses: {
          orderBy: { createdAt: "desc" },
          include: {
            modules: {
              orderBy: { order: "asc" },
              include: {
                lessons: { orderBy: { order: "asc" } },
                assignments: { orderBy: { order: "asc" } },
              },
            },
          },
        },
      },
    });
    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }
    return NextResponse.json(program);
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
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MENTOR")) {
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
    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl === "" ? null : parsed.data.imageUrl;
    if (parsed.data.duration !== undefined) updateData.duration = parsed.data.duration;
    if (parsed.data.skillOutcomes !== undefined) updateData.skillOutcomes = parsed.data.skillOutcomes;
    if (parsed.data.faq !== undefined) updateData.faq = parsed.data.faq === null ? Prisma.JsonNull : parsed.data.faq;

    const program = await prisma.program.update({
      where: { id },
      data: updateData as Parameters<typeof prisma.program.update>[0]["data"],
    });
    
    // Handle cohort assignment
    if (parsed.data.cohortIds !== undefined) {
      const { assignProgramToCohorts } = await import("@/lib/program-admin-service");
      await assignProgramToCohorts(id, parsed.data.cohortIds, session.user.id);
    }
    
    await logAudit({
      actorId: session.user.id,
      action: AUDIT_ACTIONS.PROGRAM_UPDATE,
      entityType: "Program",
      entityId: id,
      details: parsed.data as unknown as Record<string, unknown>,
    });
    
    const updated = await prisma.program.findUnique({
      where: { id },
      include: {
        cohorts: { select: { id: true, name: true } },
      },
    });
    
    return NextResponse.json(updated ?? program);
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
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MENTOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    
    // Check if program exists and get related counts
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        cohorts: { select: { id: true, name: true } },
        courses: {
          include: {
            modules: { select: { id: true, title: true } },
          },
        },
        _count: {
          select: {
            cohorts: true,
            courses: true,
          },
        },
      },
    });
    
    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }
    
    // Calculate total module count across all courses
    const moduleCount = program.courses.reduce((sum, course) => sum + course.modules.length, 0);
    
    // Warn if there are cohorts or courses/modules (but allow deletion - cascade will handle it)
    // In production, you might want to prevent deletion if there are active cohorts
    if (program._count.cohorts > 0 || program._count.courses > 0) {
      // Still allow deletion - Prisma cascade will delete cohorts, courses, and modules
      // But we log this in audit details
    }
    
    // Delete the program (cohorts and modules will be cascade deleted)
    await prisma.program.delete({ where: { id } });
    
    // Log audit
    await logAudit({
      actorId: session.user.id,
      action: AUDIT_ACTIONS.PROGRAM_DELETE,
      entityType: "Program",
      entityId: id,
      details: { 
        name: program.name,
        cohortCount: program._count.cohorts,
        courseCount: program._count.courses,
        moduleCount: moduleCount,
      },
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
