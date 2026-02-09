// POST /api/feedback - Add feedback (and set submission status) - mentor/admin
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidateProgress } from "@/lib/progress-service";

const createSchema = z.object({
  submissionId: z.string().min(1),
  comment: z.string().optional(),
  score: z.number().min(0).optional(),
  passed: z.boolean().optional(),
  status: z.enum(["APPROVED", "REJECTED", "RESUBMIT_REQUESTED"]),
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
    const submission = await prisma.submission.findUnique({
      where: { id: parsed.data.submissionId },
      include: { assignment: { include: { module: true } } },
    });
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    // Mentor can only give feedback if they are the assigned reviewer or no reviewer assigned (cohort mentor)
    if (session.user.role === "MENTOR") {
      if (submission.assignedReviewerId && submission.assignedReviewerId !== session.user.id) {
        return NextResponse.json(
          { error: "This submission was reassigned to another mentor" },
          { status: 403 }
        );
      }
    }
    const feedback = await prisma.feedback.create({
      data: {
        submissionId: parsed.data.submissionId,
        mentorId: session.user.id,
        comment: parsed.data.comment,
        score: parsed.data.score,
        passed: parsed.data.passed,
      },
    });
    await prisma.submission.update({
      where: { id: parsed.data.submissionId },
      data: {
        status: parsed.data.status,
        reviewedAt: new Date(),
      },
    });
    // Recompute module progress when approved
    if (parsed.data.status === "APPROVED") {
      await revalidateProgress(submission.traineeId, submission.assignment.moduleId);
    }
    return NextResponse.json(feedback);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
