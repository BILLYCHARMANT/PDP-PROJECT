// GET /api/analytics - Admin analytics: progress, completion rates, drop-offs
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("programId");
    const cohortId = searchParams.get("cohortId");

    const programFilter = programId ? { programId } : {};
    const cohortFilter = cohortId ? { cohortId } : {};

    const [programs, cohorts, enrollments, progress, certificates] =
      await Promise.all([
        prisma.program.findMany({
          where: programFilter,
          select: { id: true, name: true },
        }),
        cohortId
          ? prisma.cohort.findMany({
              where: { id: cohortId },
              include: { program: { select: { name: true } } },
            })
          : prisma.cohort.findMany({
              where: { program: programFilter },
              include: { program: { select: { name: true } } },
            }),
        prisma.enrollment.findMany({
          where: cohortFilter,
          select: { traineeId: true, cohortId: true },
        }),
        prisma.progress.findMany({
          where: {
            module: programId ? { programId } : {},
          },
          select: {
            traineeId: true,
            moduleId: true,
            status: true,
            percentComplete: true,
          },
        }),
        prisma.certificate.findMany({
          where: programId ? { programId } : {},
          select: { traineeId: true, programId: true },
        }),
      ]);

    const traineeIds = [...new Set(enrollments.map((e) => e.traineeId))];
    const totalTrainees = traineeIds.length;
    const completedPrograms = certificates.length;
    const completionRate =
      totalTrainees > 0
        ? Math.round((completedPrograms / totalTrainees) * 100)
        : 0;

    const byModule = progress.reduce(
      (acc, p) => {
        if (!acc[p.moduleId]) acc[p.moduleId] = [];
        acc[p.moduleId].push(p);
        return acc;
      },
      {} as Record<string, typeof progress>
    );
    const moduleStats = Object.entries(byModule).map(([moduleId, list]) => {
      const completed = list.filter((p) => p.status === "COMPLETED").length;
      const avg =
        list.length > 0
          ? Math.round(
              list.reduce((s, p) => s + p.percentComplete, 0) / list.length
            )
          : 0;
      return { moduleId, completed, total: list.length, avgProgress: avg };
    });

    return NextResponse.json({
      programs,
      cohorts,
      totalTrainees,
      completionRate,
      certificatesIssued: completedPrograms,
      moduleStats,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
