import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isModuleUnlocked, isLessonUnlocked } from "@/lib/trainee-linear-access";

export default async function TraineeModulePage({
  params,
}: {
  params: Promise<{ programId: string; moduleId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TRAINEE") redirect("/dashboard");
  const { programId, moduleId } = await params;

  const module_ = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      course: { include: { program: { select: { id: true, name: true } } } },
      lessons: { orderBy: { order: "asc" } },
      assignments: { orderBy: { order: "asc" } },
    },
  });
  if (!module_ || module_.course?.programId !== programId) notFound();

  const course = module_.course;
  if (course) {
    const now = new Date();
    if (course.startDate != null && now < course.startDate) notFound();
    if (course.endDate != null && now > course.endDate) notFound();
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      traineeId: session.user.id,
      cohort: { programId },
    },
  });
  if (!enrollment) notFound();

  const unlocked = await isModuleUnlocked(session.user.id, programId, moduleId);
  if (!unlocked) redirect(`/dashboard/trainee/learn/${programId}`);

  const accessedLessons = await prisma.lessonAccess.findMany({
    where: {
      traineeId: session.user.id,
      lessonId: { in: module_.lessons.map((l) => l.id) },
    },
    select: { lessonId: true },
  });
  const accessedSet = new Set(accessedLessons.map((a) => a.lessonId));
  const orderedLessonIds = module_.lessons.map((l) => l.id);
  const allChaptersCompleted = module_.lessons.length > 0 && module_.lessons.every((l) => accessedSet.has(l.id));

  const quotes = module_.inspiringQuotes
    ? module_.inspiringQuotes
        .split("\n")
        .map((q) => q.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold tracking-tight text-[#171717] dark:text-[#f9fafb] md:text-3xl">
        {module_.title}
      </h1>

      <section className="rounded-2xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-6 shadow-sm">
        {module_.description ? (
          <div className="text-[17px] leading-[1.75] text-[#374151] dark:text-[#d1d5db] whitespace-pre-wrap">
            {module_.description}
          </div>
        ) : (
          <p className="text-[17px] leading-[1.75] text-[#6b7280] dark:text-[#9ca3af]">
            Welcome to this module. Open a chapter below to start learning.
          </p>
        )}
      </section>

      {quotes.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9ca3af]">
            Inspiration
          </h2>
          <ul className="space-y-4">
            {quotes.map((quote, i) => (
              <li
                key={i}
                className="rounded-xl border-l-4 py-4 pl-5 pr-5 shadow-sm"
                style={{
                  borderLeftColor: "var(--unipod-blue)",
                  backgroundColor: "var(--unipod-blue-light)",
                }}
              >
                <p className="text-[16px] italic leading-[1.7] text-[#374151] dark:text-[#d1d5db]">
                  &ldquo;{quote}&rdquo;
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {module_.lessons.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb] mb-3">Chapters</h2>
          <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mb-4">
            Complete chapters in order. Open the next chapter after finishing the previous one.
          </p>
          <ul className="space-y-2">
            {module_.lessons.map((lesson) => {
              const lessonUnlocked = isLessonUnlocked(lesson.id, orderedLessonIds, accessedSet);
              return (
                <li key={lesson.id}>
                  {lessonUnlocked ? (
                    <Link
                      href={`/dashboard/trainee/learn/${programId}/${moduleId}/${lesson.id}`}
                      className="group flex items-center gap-3 rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-4 py-3 transition-colors hover:border-[var(--unipod-blue)] hover:bg-[var(--unipod-blue-light)]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--sidebar-bg)] dark:bg-[#374151]">
                        <svg className="h-5 w-5 text-[#6b7280] dark:text-[#9ca3af]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </span>
                      <span className="font-medium text-[#171717] dark:text-[#f9fafb] group-hover:text-[var(--unipod-blue)]">
                        {lesson.title}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827] px-4 py-3 opacity-75">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--sidebar-bg)] dark:bg-[#374151]">
                        <svg className="h-5 w-5 text-[#9ca3af]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </span>
                      <span className="font-medium text-[#6b7280] dark:text-[#9ca3af]">
                        {lesson.title}
                      </span>
                      <span className="ml-auto text-xs text-[#6b7280] dark:text-[#9ca3af]">Complete previous chapter first</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {module_.assignments.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb] mb-3">Assignments</h2>
          {allChaptersCompleted ? (
            <>
              <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mb-4">
                All chapters completed. You can now submit your assignment(s).
              </p>
              <ul className="space-y-2">
                {module_.assignments.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/dashboard/trainee/learn/${programId}/${moduleId}/assignment/${a.id}`}
                      className="group flex items-center gap-3 rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-4 py-3 transition-colors hover:border-[var(--unipod-blue)] hover:bg-[var(--unipod-blue-light)]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--sidebar-bg)] dark:bg-[#374151]">
                        <svg className="h-5 w-5 text-[#6b7280] dark:text-[#9ca3af]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </span>
                      <span className="font-medium text-[#171717] dark:text-[#f9fafb] group-hover:text-[var(--unipod-blue)]">
                        {a.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827] px-4 py-3">
              <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">
                Complete all chapters in this module to unlock the assignment(s).
              </p>
            </div>
          )}
        </section>
      )}

      {module_.lessons.length === 0 && module_.assignments.length === 0 && (
        <p className="text-[#6b7280] dark:text-[#9ca3af]">No chapters in this module yet. Check back later.</p>
      )}
    </div>
  );
}
