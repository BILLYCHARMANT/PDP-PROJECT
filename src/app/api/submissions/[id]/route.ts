// GET /api/submissions/[id] - Get submission with feedback
// PATCH /api/submissions/[id] - Update submission (trainee, only if RESUBMIT_REQUESTED)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { SubmissionStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  content: z.string().optional(),
  fileUrl: z.string().optional(),
  externalLink: z.string().optional(),
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
    // Module has course relation (Program → Course → Module); include types may not reflect it in all envs
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: { include: { module: { select: { id: true, title: true, courseId: true } } } },
        trainee: { select: { id: true, name: true, email: true } },
        feedback: {
          include: {
            mentor: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    if (
      session.user.role === "TRAINEE" &&
      submission.traineeId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(submission);
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
    if (!session?.user || session.user.role !== "TRAINEE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const existing = await prisma.submission.findUnique({ where: { id } });
    if (!existing || existing.traineeId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (existing.status !== SubmissionStatus.RESUBMIT_REQUESTED) {
      return NextResponse.json(
        { error: "Submission cannot be updated in current status" },
        { status: 400 }
      );
    }
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const submission = await prisma.submission.update({
      where: { id },
      data: { ...parsed.data, status: SubmissionStatus.PENDING },
      include: { assignment: { select: { id: true, title: true } } },
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
