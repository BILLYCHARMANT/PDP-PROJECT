import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuleForm } from "@/components/admin/ModuleForm";
import { LessonList } from "@/components/admin/LessonList";
import { AssignmentList } from "@/components/admin/AssignmentList";
import { ModuleSubmissionsList } from "@/components/admin/ModuleSubmissionsList";

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MENTOR")) redirect("/dashboard");
  const { id: courseId, moduleId } = await params;
  const module_ = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      lessons: { orderBy: { order: "asc" } },
      assignments: { orderBy: { order: "asc" } },
    },
  });
  if (!module_ || module_.courseId !== courseId) notFound();

  const assignmentIds = module_.assignments.map((a) => a.id);
  const submissions = assignmentIds.length
    ? await prisma.submission.findMany({
        where: { assignmentId: { in: assignmentIds } },
        orderBy: { submittedAt: "desc" },
        include: {
          assignment: { select: { title: true } },
          trainee: { select: { name: true, email: true } },
        },
      })
    : [];

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-2 text-sm text-slate-600">
        <Link
          href={`/dashboard/admin/programs/${courseId}`}
          className="hover:text-slate-900"
        >
          Course
        </Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-slate-800">{module_.title}</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-4">
          Module: {module_.title}
        </h1>
        <ModuleForm
          courseId={courseId}
          moduleId={module_.id}
          initial={{
            title: module_.title,
            description: module_.description ?? "",
            inspiringQuotes: module_.inspiringQuotes ?? "",
            order: module_.order,
            startDate: module_.startDate ? module_.startDate.toISOString().slice(0, 16) : null,
            endDate: module_.endDate ? module_.endDate.toISOString().slice(0, 16) : null,
          }}
        />
      </div>

      {/* Content: chapters (lessons) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Chapters
          </h2>
          <Link
            href={`/dashboard/admin/programs/${courseId}?moduleId=${moduleId}&createChapter=1`}
            className="rounded-lg px-3 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--unipod-blue)" }}
          >
            Add chapter
          </Link>
        </div>
        <LessonList
          programId={courseId}
          moduleId={moduleId}
          lessons={module_.lessons}
        />
      </section>

      {/* Assignments */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Assignments</h2>
          <Link
            href={`/dashboard/admin/programs/${courseId}/modules/${moduleId}/assignments/new`}
            className="rounded-lg px-3 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--unipod-blue)" }}
          >
            Add assignment
          </Link>
        </div>
        <AssignmentList
          programId={courseId}
          moduleId={moduleId}
          assignments={module_.assignments}
        />

        {/* Module schedule card */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Module schedule</h3>
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-slate-500">Start</dt>
              <dd className="font-medium text-slate-800">
                {module_.startDate
                  ? new Date(module_.startDate).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">End</dt>
              <dd className="font-medium text-slate-800">
                {module_.endDate
                  ? new Date(module_.endDate).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Not set"}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-slate-500 mt-2">
            Set or update in the module form above. Assignments have their own due dates.
          </p>
        </div>
      </section>

      {/* Submissions */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Submissions
        </h2>
        <ModuleSubmissionsList submissions={submissions} />
      </section>
    </div>
  );
}
