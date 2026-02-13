// POST /api/courses/[id]/approve - Approve course and optionally assign to program (admin only)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const approveSchema = z.object({
  programId: z.string().nullable().optional(), // Optional: can assign to program during approval
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    // Only admin can approve courses
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();
    const parsed = approveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    // Verify program exists if programId is provided
    if (parsed.data.programId) {
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
    
    // Update course: approve (set status to ACTIVE) and optionally assign to program
    const course = await prisma.course.update({
      where: { id },
      data: {
        status: "ACTIVE",
        ...(parsed.data.programId !== undefined && { programId: parsed.data.programId || null }),
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
