// GET /api/courses - List courses (optionally filtered by programId)
// POST /api/courses - Create course within a program
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  programId: z.string().optional(), // Optional: Course can be assigned to program later
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal("")),
  duration: z.string().optional(),
  skillOutcomes: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("programId");
    
    const where: any = programId ? { programId } : {};
    
    // For non-admins, only show approved (ACTIVE) courses
    if (session.user.role !== "ADMIN") {
      where.status = "ACTIVE";
    }
    
    const courses = await prisma.course.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        duration: true,
        programId: true,
        status: true,
        program: { select: { id: true, name: true } },
        modules: { select: { id: true, title: true, order: true } },
      },
    });
    return NextResponse.json(courses);
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
    
    // Set status: PENDING for mentors, ACTIVE for admins (admins have all rights, auto-approved)
    const status = session.user.role === "MENTOR" ? "PENDING" : "ACTIVE";
    
    const course = await prisma.course.create({
      data: {
        programId: parsed.data.programId || null, // Optional: can be assigned later
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        imageUrl: parsed.data.imageUrl && parsed.data.imageUrl !== "" ? parsed.data.imageUrl : null,
        duration: parsed.data.duration ?? null,
        skillOutcomes: parsed.data.skillOutcomes ?? null,
        status: status,
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
