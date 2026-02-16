import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CohortForm } from "@/components/admin/CohortForm";
import { prisma } from "@/lib/prisma";

export default async function NewCohortPage({
  searchParams,
}: {
  searchParams: Promise<{ programId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");
  const { programId } = await searchParams;
  const [programs, courses, mentors] = await Promise.all([
    prisma.program.findMany({ orderBy: { name: "asc" } }),
    prisma.course.findMany({
      select: { id: true, name: true, programId: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "MENTOR" },
      select: { id: true, name: true, email: true },
    }),
  ]);
  const initial = programId ? { programId } : {};
  return (
    <div>
      <Link
        href="/dashboard/admin/cohorts"
        className="text-sm text-slate-600 hover:text-slate-900"
      >
        ← Cohorts
      </Link>
      <h1 className="text-2xl font-bold text-slate-800 mt-4 mb-4">
        New cohort
      </h1>
      <CohortForm programs={programs} allCourses={courses} mentors={mentors} initial={initial} />
    </div>
  );
}
