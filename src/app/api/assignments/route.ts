// POST /api/assignments - Create assignment (admin)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  instructions: z.string().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  order: z.number().int().min(0).optional(),
  mandatory: z.boolean().optional(),
});

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
    const mandatoryCount = await prisma.assignment.count({
      where: { moduleId: parsed.data.moduleId, mandatory: true },
    });
    const mandatory =
      parsed.data.mandatory ?? (mandatoryCount === 0);
    if (mandatoryCount >= 1 && mandatory) {
      return NextResponse.json(
        { error: "Module already has one mandatory assignment" },
        { status: 400 }
      );
    }
    const assignment = await prisma.assignment.create({
      data: {
        moduleId: parsed.data.moduleId,
        title: parsed.data.title,
        description: parsed.data.description,
        instructions: parsed.data.instructions,
        dueDate: parsed.data.dueDate
          ? new Date(parsed.data.dueDate)
          : undefined,
        order: parsed.data.order,
        mandatory,
      },
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
