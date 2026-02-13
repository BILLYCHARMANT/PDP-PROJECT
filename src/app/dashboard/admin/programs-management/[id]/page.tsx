import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProgramForm } from "@/components/admin/ProgramForm";
import { CoursesList } from "@/components/admin/CoursesList";
import { AssignCoursesToProgram } from "@/components/admin/AssignCoursesToProgram";

export default async function ProgramManagementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MENTOR")) {
    redirect("/dashboard");
  }
  const { id } = await params;
  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      courses: {
        orderBy: { createdAt: "desc" },
        include: {
          modules: { select: { id: true, title: true, order: true } },
        },
      },
      cohorts: true,
    },
  });
  if (!program) notFound();
  
  return (
    <div
      className="min-h-full rounded-xl p-6 space-y-8"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      <Link
        href="/dashboard/admin/programs-management"
        className="text-sm font-medium text-[#6b7280] dark:text-[#9ca3af] hover:text-[#171717] dark:hover:text-[#f9fafb]"
      >
        ← Programs
      </Link>
      <div className="rounded-lg border border-[var(--unipod-blue)]/30 bg-[var(--unipod-blue-light)]/50 dark:bg-[#1f2937] dark:border-[#374151] px-4 py-3 mb-6">
        <p className="text-sm text-[#374151] dark:text-[#d1d5db]">
          <strong>Flow:</strong> Create programs and courses independently. Then assign courses to programs. Courses → Modules → Lessons/Assignments.
        </p>
      </div>
      <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">Edit Program</h1>
        </div>
        <ProgramForm
          programId={program.id}
          initial={{
            name: program.name,
            description: program.description ?? "",
            imageUrl: program.imageUrl ?? "",
            duration: program.duration ?? "",
          }}
        />
      </div>
      <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb]">Assign Courses</h2>
        </div>
        <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mb-4">
          Assign existing courses to this program. Courses can be created independently and then assigned to programs.
        </p>
        <AssignCoursesToProgram
          programId={id}
          assignedCourseIds={program.courses.map((c) => c.id)}
        />
      </div>
      <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb]">Assigned Courses</h2>
        </div>
        <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mb-4">
          Courses assigned to this program. Click on a course to manage its modules and lessons.
        </p>
        <CoursesList programId={id} courses={program.courses} />
      </div>
    </div>
  );
}
