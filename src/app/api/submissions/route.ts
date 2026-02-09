// GET /api/submissions?assignmentId=&traineeId= - List submissions (mentor/admin or own)
// POST /api/submissions - Create submission (trainee)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  assignmentId: z.string().min(1),
  content: z.string().optional(),
  fileUrl: z.string().optional(),
  externalLink: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("assignmentId");
    const traineeId = searchParams.get("traineeId");
    const where: Record<string, unknown> = {};
    if (assignmentId) where.assignmentId = assignmentId;
    if (session.user.role === "TRAINEE") {
      where.traineeId = session.user.id;
    } else if (traineeId) {
      where.traineeId = traineeId;
    }
    const submissions = await prisma.submission.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      include: {
        assignment: { select: { id: true, title: true, moduleId: true } },
        trainee: { select: { id: true, name: true, email: true } },
        feedback: true,
      },
    });
    return NextResponse.json(submissions);
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
    if (!session?.user || session.user.role !== "TRAINEE") {
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
    const submission = await prisma.submission.create({
      data: {
        assignmentId: parsed.data.assignmentId,
        traineeId: session.user.id,
        content: parsed.data.content,
        fileUrl: parsed.data.fileUrl,
        externalLink: parsed.data.externalLink,
        status: "PENDING",
      },
      include: {
        assignment: { select: { id: true, title: true } },
      },
    });
    return NextResponse.json(submission);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
