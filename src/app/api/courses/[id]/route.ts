// GET /api/courses/[id] - Get course details
// PATCH /api/courses/[id] - Update course
// DELETE /api/courses/[id] - Delete course
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal("")),
  duration: z.string().optional(),
  skillOutcomes: z.string().optional(),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
  programId: z.string().nullable().optional(),
  status: z.enum(["PENDING", "INACTIVE", "ACTIVE"]).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        duration: true,
        skillOutcomes: true,
        faq: true,
        status: true,
        programId: true,
        startDate: true,
        endDate: true,
        program: { select: { id: true, name: true } },
        modules: { select: { id: true, title: true, order: true } },
      },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    return NextResponse.json(course);
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
    
    // Verify program exists if programId is being set
    // Only admin can assign courses to programs
    if (parsed.data.programId !== undefined && parsed.data.programId !== null) {
      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only admins can assign courses to programs" },
          { status: 403 }
        );
      }
      const program = await prisma.program.findUnique({
        where: { id: parsed.data.programId },
      });
      if (!program) {
        return NextResponse.json(
          { error: "Program not found" },
          { status: 404 }
        );
      }
    }
    
    // Only admin can update status or assign to programs
    if ((parsed.data.status !== undefined || parsed.data.programId !== undefined) && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can update course status or assign to programs" },
        { status: 403 }
      );
    }
    
    const startDate = parsed.data.startDate !== undefined
      ? (parsed.data.startDate && parsed.data.startDate !== "" ? new Date(parsed.data.startDate) : null)
      : undefined;
    const endDate = parsed.data.endDate !== undefined
      ? (parsed.data.endDate && parsed.data.endDate !== "" ? new Date(parsed.data.endDate) : null)
      : undefined;

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(parsed.data.name && { name: parsed.data.name }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description || null }),
        ...(parsed.data.imageUrl !== undefined && { imageUrl: parsed.data.imageUrl && parsed.data.imageUrl !== "" ? parsed.data.imageUrl : null }),
        ...(parsed.data.duration !== undefined && { duration: parsed.data.duration || null }),
        ...(parsed.data.skillOutcomes !== undefined && { skillOutcomes: parsed.data.skillOutcomes || null }),
        ...(parsed.data.faq !== undefined && { faq: parsed.data.faq }),
        ...(parsed.data.programId !== undefined && { programId: parsed.data.programId || null }),
        ...(parsed.data.status !== undefined && { status: parsed.data.status }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
      },
      include: {
        program: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(course);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MENTOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    
    // Check if course exists and get related counts for audit
    const course = await prisma.course.findUnique({
      where: { id },
      include: { 
        modules: { 
          include: { 
            lessons: { select: { id: true } },
            assignments: { select: { id: true } }
          } 
        } 
      },
    });
    
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    
    // Count lessons and assignments for audit
    const moduleCount = course.modules.length;
    const lessonCount = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
    const assignmentCount = course.modules.reduce((sum, module) => sum + module.assignments.length, 0);
    
    // Delete the course (modules, lessons, and assignments will be cascade deleted via Prisma)
    await prisma.course.delete({ where: { id } });
    
    // Log audit if audit service is available
    try {
      const { logAudit, AUDIT_ACTIONS } = await import("@/lib/audit-service");
      await logAudit({
        actorId: session.user.id,
        action: AUDIT_ACTIONS.COURSE_DELETE,
        entityType: "Course",
        entityId: id,
        details: { 
          name: course.name,
          moduleCount,
          lessonCount,
          assignmentCount,
        },
      });
    } catch (auditError) {
      // Audit logging is optional, don't fail the deletion if it fails
      console.warn("Failed to log audit:", auditError);
    }
    
    return NextResponse.json({ 
      success: true,
      deleted: {
        modules: moduleCount,
        lessons: lessonCount,
        assignments: assignmentCount,
      }
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
