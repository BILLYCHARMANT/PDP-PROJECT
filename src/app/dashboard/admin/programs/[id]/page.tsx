import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProgramForm } from "@/components/admin/ProgramForm";
import { ModuleList } from "@/components/admin/ModuleList";
import { DeleteProgramButton } from "@/components/admin/DeleteProgramButton";
import { AssignCourseToCohorts } from "@/components/admin/AssignCourseToCohorts";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MENTOR")) redirect("/dashboard");
  const { id } = await params;
  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      modules: { orderBy: { order: "asc" }, include: { lessons: true, assignments: true } },
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
        href="/dashboard/admin/programs"
        className="text-sm font-medium text-[#6b7280] dark:text-[#9ca3af] hover:text-[#171717] dark:hover:text-[#f9fafb]"
      >
        ← Course List
      </Link>
      <div className="rounded-lg border border-[var(--unipod-blue)]/30 bg-[var(--unipod-blue-light)]/50 dark:bg-[#1f2937] dark:border-[#374151] px-4 py-3 mb-6">
        <p className="text-sm text-[#374151] dark:text-[#d1d5db]">
          <strong>Flow:</strong> Trainees in a cohort → access the <strong>course</strong> for that cohort → course contains <strong>modules</strong> → modules contain <strong>chapters</strong> (and assignments).
        </p>
      </div>
      <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">Edit course</h1>
          <DeleteProgramButton 
            programId={program.id}
            programName={program.name}
            cohortCount={program.cohorts.length}
            moduleCount={program.modules.length}
          />
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
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[#171717]">Modules</h2>
          <Link
            href={`/dashboard/admin/programs/${id}/modules/new`}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--unipod-blue)" }}
          >
            Create module
          </Link>
        </div>
        <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mb-4">
          Trainees in this course’s cohort(s) see all modules and chapters here. Add modules, then add chapters inside each module.
        </p>
        <ModuleList programId={id} modules={program.modules} />
      </div>
      <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb] mb-2">Assign to cohorts</h2>
        <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mb-4">
          Assign this course to one or more cohorts. Trainees enrolled in those cohorts will see this course and all its modules in their "My learning" section.
        </p>
        <AssignCourseToCohorts
          programId={program.id}
          assignedCohortIds={program.cohorts.map((c) => c.id)}
        />
        {program.cohorts.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[#e5e7eb] dark:border-[#374151]">
            <h3 className="text-sm font-semibold text-[#171717] dark:text-[#f9fafb] mb-3">
              Currently assigned cohorts ({program.cohorts.length})
            </h3>
            <ul className="space-y-2">
              {program.cohorts.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/admin/cohorts/${c.id}`}
                    className="text-sm font-medium"
                    style={{ color: "var(--unipod-blue)" }}
                  >
                    {c.name} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
