// GET - List enrollments that may need a reminder (at-risk or behind)
// POST - Send reminder (sets lastReminderAt on enrollment)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "MENTOR" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Mentor: all enrollments in cohorts they mentor. Admin: at-risk only.
    const where =
      session.user.role === "MENTOR"
        ? { cohort: { mentorId: session.user.id } }
        : { atRisk: true };
    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        trainee: { select: { id: true, name: true, email: true } },
        cohort: {
          include: {
            program: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });
    return NextResponse.json(enrollments);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const postSchema = z.object({ enrollmentId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "MENTOR" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const enrollment = await prisma.enrollment.update({
      where: { id: parsed.data.enrollmentId },
      data: { lastReminderAt: new Date() },
      include: {
        trainee: { select: { name: true, email: true } },
        cohort: { include: { program: { select: { name: true } } } },
      },
    });
    return NextResponse.json({
      success: true,
      lastReminderAt: enrollment.lastReminderAt,
      message: `Reminder recorded for ${enrollment.trainee.name}`,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
