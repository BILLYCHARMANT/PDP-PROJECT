// GET /api/admin/users/[id] - User details + stats (admin only)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        imageUrl: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            submissions: true,
            feedbackGiven: true,
            cohortsMentoring: true,
            certificates: true,
          },
        },
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [submissionsByStatus, enrollmentsWithProgram] = await Promise.all([
      prisma.submission.groupBy({
        by: ["status"],
        where: { traineeId: id },
        _count: { id: true },
      }),
      prisma.enrollment.findMany({
        where: { traineeId: id },
        include: {
          cohort: { include: { program: { select: { name: true } } } },
        },
        take: 10,
      }),
    ]);

    const statusCounts = { PENDING: 0, APPROVED: 0, REJECTED: 0, RESUBMIT_REQUESTED: 0 };
    submissionsByStatus.forEach((s) => {
      statusCounts[s.status as keyof typeof statusCounts] = s._count.id;
    });
    const totalSubmissions = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const approvedCount = statusCounts.APPROVED;
    const onTimeRate = totalSubmissions > 0 ? Math.round((approvedCount / totalSubmissions) * 100) : 0;

    const { _count, ...userData } = user;
    return NextResponse.json({
      ...userData,
      stats: {
        enrollments: _count.enrollments,
        submissions: _count.submissions,
        feedbackGiven: _count.feedbackGiven,
        cohortsMentoring: _count.cohortsMentoring,
        certificates: _count.certificates,
        submissionStatusCounts: statusCounts,
        onTimeDeliveryRate: onTimeRate,
      },
      recentEnrollments: enrollmentsWithProgram.map((e) => ({
        id: e.id,
        programName: e.cohort.program?.name ?? "—",
        cohortName: e.cohort.name,
        enrolledAt: e.enrolledAt,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
