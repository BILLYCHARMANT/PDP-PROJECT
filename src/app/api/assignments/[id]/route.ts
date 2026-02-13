// GET /api/assignments/[id] - Get assignment with submissions (mentor) or own submission (trainee)
// PATCH /api/assignments/[id] - Update assignment (admin)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  dueDate: z.string().optional().nullable(), // ISO or datetime-local string
  order: z.number().int().min(0).optional(),
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
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        module: { select: { id: true, title: true, course: { select: { programId: true } } } },
        submissions:
          session.user.role === "TRAINEE"
            ? { where: { traineeId: session.user.id }, include: { feedback: true } }
            : { include: { trainee: { select: { id: true, name: true, email: true } }, feedback: true } },
      },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    return NextResponse.json(assignment);
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
    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.dueDate !== undefined) {
      data.dueDate = parsed.data.dueDate
        ? new Date(parsed.data.dueDate)
        : null;
    }
    const assignment = await prisma.assignment.update({
      where: { id },
      data,
      include: { module: { select: { id: true, title: true } } },
    });
    return NextResponse.json(assignment);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
