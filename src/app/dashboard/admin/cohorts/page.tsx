import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CohortsList } from "@/components/admin/CohortsList";

export default async function AdminCohortsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const [programs, courses, mentors] = await Promise.all([
    prisma.program.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.course.findMany({
      select: { id: true, name: true, programId: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "MENTOR" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <div
      className="min-h-full rounded-xl p-6"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      <h1 className="text-2xl md:text-3xl font-bold text-[#171717] mb-6">
        Cohorts
      </h1>
      <CohortsList
        programs={programs}
        allCourses={courses}
        mentors={mentors}
      />
    </div>
  );
}
