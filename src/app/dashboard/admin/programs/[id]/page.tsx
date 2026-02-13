import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CourseStructureTabs } from "@/components/admin/CourseStructureTabs";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MENTOR")) redirect("/dashboard");
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: { orderBy: { order: "asc" }, include: { lessons: true, assignments: true } },
    },
  });
  if (!course) notFound();

  return (
    <div
      className="min-h-full rounded-xl p-6 space-y-6"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      <Link
        href="/dashboard/admin/programs"
        className="text-sm font-medium text-[#6b7280] dark:text-[#9ca3af] hover:text-[#171717] dark:hover:text-[#f9fafb]"
      >
        ← Course List
      </Link>
      <div className="rounded-lg border border-[var(--unipod-blue)]/30 bg-[var(--unipod-blue-light)]/50 dark:bg-[#1f2937] dark:border-[#374151] px-4 py-3">
        <p className="text-sm text-[#374151] dark:text-[#d1d5db]">
          <strong>Flow:</strong> Course → <strong>modules</strong> → <strong>chapters</strong>. Select a module to view its chapters.
        </p>
      </div>

      <CourseStructureTabs
        courseId={course.id}
        courseName={course.name}
        modules={course.modules}
      />
    </div>
  );
}
