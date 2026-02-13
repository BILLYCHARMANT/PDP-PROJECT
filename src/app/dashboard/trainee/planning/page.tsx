import { getServerSession } from "next-auth";
import { SubmissionStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TraineePlanningContent } from "@/components/trainee/TraineePlanningContent";

export default async function TraineePlanningPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TRAINEE") redirect("/dashboard");

  const enrollments = await prisma.enrollment.findMany({
    where: { traineeId: session.user.id },
    include: {
      cohort: {
        select: {
          name: true,
          startDate: true,
          endDate: true,
          programId: true,
          program: { select: { id: true, name: true, duration: true } },
        },
      },
    },
  });

  const programIds = [...new Set(enrollments.map((e) => e.cohort.programId).filter(Boolean))] as string[];

  const modules =
    programIds.length > 0
      ? await prisma.module.findMany({
          where: { course: { programId: { in: programIds } } },
          select: {
            id: true,
            title: true,
            order: true,
            startDate: true,
            endDate: true,
            course: { select: { programId: true, program: { select: { name: true } } } },
          },
        })
      : [];
  const moduleIds = modules.map((m) => m.id);

  const assignments =
    programIds.length > 0
      ? await prisma.assignment.findMany({
          where: { module: { course: { programId: { in: programIds } } } },
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            moduleId: true,
            module: {
              select: { title: true, course: { select: { programId: true, program: { select: { name: true } } } } },
            },
          },
        })
      : [];

  const assignmentIds = assignments.map((a) => a.id);

  const lessonsForProgram =
    programIds.length > 0
      ? await prisma.lesson.findMany({
          where: { module: { course: { programId: { in: programIds } } } },
          select: { id: true, title: true, order: true, moduleId: true },
        })
      : [];
  const lessonIds = lessonsForProgram.map((l) => l.id);
  const moduleIdToProgramId = new Map(
    modules.map((m) => [m.id, m.course?.programId]).filter((e): e is [string, string] => e[1] != null)
  );

  const [approvedSubmissionsCount, progressRecords, traineeScheduledEvents, accessedLessons] = await Promise.all([
    assignmentIds.length > 0
      ? prisma.submission.count({
          where: {
            traineeId: session.user.id,
            assignmentId: { in: assignmentIds },
            status: SubmissionStatus.APPROVED,
          },
        })
      : 0,
    moduleIds.length > 0
      ? prisma.progress.findMany({
          where: {
            traineeId: session.user.id,
            moduleId: { in: moduleIds },
          },
          select: { moduleId: true, percentComplete: true, status: true },
        })
      : [],
    prisma.traineeScheduledEvent.findMany({
      where: { traineeId: session.user.id },
      orderBy: { date: "asc" },
      include: {
        mentor: { select: { name: true } },
        module: { select: { title: true } },
        lesson: { select: { title: true } },
      },
    }),
    lessonIds.length > 0
      ? prisma.lessonAccess.findMany({
          where: {
            traineeId: session.user.id,
            lessonId: { in: lessonIds },
          },
          select: { lessonId: true },
        })
      : [],
  ]);

  const accessedLessonIds = new Set(accessedLessons.map((a) => a.lessonId));

  const cohortDuration =
    enrollments[0]?.cohort?.startDate && enrollments[0]?.cohort?.endDate
      ? (() => {
          const s = new Date(enrollments[0].cohort.startDate);
          const e = new Date(enrollments[0].cohort.endDate!);
          const weeks = Math.round((e.getTime() - s.getTime()) / (7 * 24 * 60 * 60 * 1000));
          return weeks ? `${weeks} weeks` : null;
        })()
      : enrollments[0]?.cohort?.program?.duration ?? null;

  const totalScheduledTasks = assignmentIds.length;
  const completedScheduledTasks = approvedSubmissionsCount;

  const totalChapters = lessonsForProgram.length;
  const completedChapters = accessedLessonIds.size;

  // Per-program completion: all courses from cohort must be completed for 100%
  const programChapterCounts = new Map<string, { total: number; completed: number }>();
  for (const lesson of lessonsForProgram) {
    const programId = moduleIdToProgramId.get(lesson.moduleId);
    if (!programId) continue;
    const entry = programChapterCounts.get(programId) ?? { total: 0, completed: 0 };
    entry.total += 1;
    if (accessedLessonIds.has(lesson.id)) entry.completed += 1;
    programChapterCounts.set(programId, entry);
  }
  const perProgramPercents =
    programIds.length > 0
      ? programIds
          .filter((pid) => (programChapterCounts.get(pid)?.total ?? 0) > 0)
          .map((pid) => {
            const { total, completed } = programChapterCounts.get(pid)!;
            return Math.round((completed / total) * 100);
          })
      : [];
  const courseProgressPercentFromChapters =
    perProgramPercents.length > 0
      ? Math.min(...perProgramPercents) // 100% only when every course (program) in cohort is complete
      : totalChapters === 0
        ? null
        : Math.round((completedChapters / totalChapters) * 100);
  const courseProgressPercentFromProgress =
    progressRecords.length > 0
      ? Math.round(
          progressRecords.reduce((sum, p) => sum + (p.status === "COMPLETED" ? 100 : p.percentComplete), 0) /
            progressRecords.length
        )
      : null;
  const courseProgressPercent =
    courseProgressPercentFromChapters ?? courseProgressPercentFromProgress ?? 0;

  const assignmentItems = assignments
    .filter((a) => a.module.course?.programId && a.module.course?.program?.name)
    .map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate,
      moduleId: a.moduleId,
      moduleTitle: a.module.title,
      programId: a.module.course!.programId!,
      programName: a.module.course!.program!.name,
    }));

  const enrollmentItems = enrollments
    .filter((e) => e.cohort.programId != null)
    .map((e) => ({
      cohortStart: e.cohort.startDate,
      cohortEnd: e.cohort.endDate ?? e.extendedEndDate,
      programName: e.cohort.program?.name ?? "Course",
      programId: e.cohort.programId!,
    }));

  type ScheduleItemType =
    | "course_start"
    | "course_end"
    | "module_start"
    | "module_end"
    | "assignment_due"
    | "lab_workshop"
    | "mentor_meeting"
    | "course_schedule";
  const scheduleItems: {
    id: string;
    type: ScheduleItemType;
    date: string;
    label: string;
    programName?: string;
    moduleTitle?: string;
    href?: string;
    startTime?: string | null;
    endTime?: string | null;
    location?: string | null;
    description?: string | null;
    equipmentNeeded?: string | null;
    teamMembers?: string | null;
    requestCoffee?: boolean;
    mentorName?: string | null;
    /** PENDING | APPROVED | REJECTED — only for lab_workshop / mentor_meeting */
    requestStatus?: string;
    /** For course_schedule: module → lesson label */
    chapterLabel?: string;
  }[] = [];
  enrollmentItems.forEach((e) => {
    if (e.cohortStart) {
      const d = new Date(e.cohortStart);
      scheduleItems.push({
        id: `course-start-${e.programId}`,
        type: "course_start",
        date: d.toISOString().slice(0, 10),
        label: `${e.programName} start`,
        programName: e.programName,
        href: `/dashboard/trainee/learn/${e.programId}`,
      });
    }
    if (e.cohortEnd) {
      const d = new Date(e.cohortEnd);
      scheduleItems.push({
        id: `course-end-${e.programId}`,
        type: "course_end",
        date: d.toISOString().slice(0, 10),
        label: `${e.programName} end`,
        programName: e.programName,
        href: `/dashboard/trainee/learn/${e.programId}`,
      });
    }
  });
  modules.forEach((m) => {
    if (m.startDate) {
      const d = new Date(m.startDate);
      scheduleItems.push({
        id: `module-start-${m.id}`,
        type: "module_start",
        date: d.toISOString().slice(0, 10),
        label: `${m.course?.program?.name ?? "Course"}: ${m.title} start`,
        programName: m.course?.program?.name ?? "Course",
        moduleTitle: m.title,
        href: `/dashboard/trainee/learn/${m.course?.programId}/${m.id}`,
      });
    }
    if (m.endDate) {
      const d = new Date(m.endDate);
      scheduleItems.push({
        id: `module-end-${m.id}`,
        type: "module_end",
        date: d.toISOString().slice(0, 10),
        label: `${m.course?.program?.name ?? "Course"}: ${m.title} end`,
        programName: m.course?.program?.name ?? "Course",
        moduleTitle: m.title,
        href: `/dashboard/trainee/learn/${m.course?.programId}/${m.id}`,
      });
    }
  });
  assignmentItems.forEach((a) => {
    if (a.dueDate) {
      const d = new Date(a.dueDate);
      scheduleItems.push({
        id: `assignment-${a.id}`,
        type: "assignment_due",
        date: d.toISOString().slice(0, 10),
        label: a.title,
        programName: a.programName,
        moduleTitle: a.moduleTitle,
        href: `/dashboard/trainee/learn/${a.programId}/${a.moduleId}/assignment/${a.id}`,
      });
    }
  });
  traineeScheduledEvents.forEach((ev) => {
    const dateStr = new Date(ev.date).toISOString().slice(0, 10);
    const eventType = ev.eventType as string;
    let label: string;
    let type: "lab_workshop" | "mentor_meeting" | "course_schedule" = "lab_workshop";
    if (eventType === "MENTOR_MEETING") {
      type = "mentor_meeting";
      label = `Technical support${ev.requestCoffee ? " (Coffee)" : ""} – ${ev.location}`;
    } else if (eventType === "COURSE_SCHEDULE") {
      type = "course_schedule";
      const chapter = ev.module?.title && ev.lesson?.title ? `${ev.module.title} → ${ev.lesson.title}` : ev.lesson?.title ?? ev.module?.title ?? "Course";
      label = `Course schedule: ${chapter} – ${ev.location}`;
    } else {
      label = `Lab access – ${ev.location}`;
    }
    scheduleItems.push({
      id: ev.id,
      type,
      date: dateStr,
      label,
      startTime: ev.startTime,
      endTime: ev.endTime,
      location: ev.location,
      description: ev.description,
      equipmentNeeded: ev.equipmentNeeded,
      teamMembers: ev.teamMembers,
      requestCoffee: ev.requestCoffee,
      mentorName: ev.mentor?.name ?? null,
      requestStatus: ev.status,
      chapterLabel: eventType === "COURSE_SCHEDULE" && (ev.module?.title || ev.lesson?.title) ? `${ev.module?.title ?? ""}${ev.module?.title && ev.lesson?.title ? " → " : ""}${ev.lesson?.title ?? ""}` : undefined,
    });
  });
  scheduleItems.sort((a, b) => a.date.localeCompare(b.date));

  const userInfo = {
    name: session.user.name ?? "",
    cohortName: enrollments[0]?.cohort?.name ?? "—",
  };

  const firstProgramId = enrollmentItems[0]?.programId;
  const orderedModules = [...modules]
    .filter((m) => m.course?.programId === firstProgramId)
    .sort((a, b) => a.order - b.order);

  const lessonsByModule = new Map<string, { id: string; title: string; order: number }[]>();
  for (const l of lessonsForProgram) {
    if (!lessonsByModule.has(l.moduleId)) lessonsByModule.set(l.moduleId, []);
    lessonsByModule.get(l.moduleId)!.push({ id: l.id, title: l.title, order: l.order });
  }
  for (const arr of lessonsByModule.values()) arr.sort((a, b) => a.order - b.order);

  let nextChapter: { programId: string; moduleId: string; lessonId: string; title: string } | null = null;
  for (const mod of orderedModules) {
    const lessons = lessonsByModule.get(mod.id) ?? [];
    const firstNotAccessed = lessons.find((l) => !accessedLessonIds.has(l.id));
    if (firstNotAccessed && firstProgramId) {
      nextChapter = {
        programId: firstProgramId,
        moduleId: mod.id,
        lessonId: firstNotAccessed.id,
        title: firstNotAccessed.title,
      };
      break;
    }
  }

  const progressByModule = new Map(
    progressRecords.map((p) => [p.moduleId, { status: p.status, percentComplete: p.percentComplete }])
  );
  const firstIncompleteModule = orderedModules.find(
    (m) => !progressByModule.get(m.id) || progressByModule.get(m.id)!.status !== "COMPLETED"
  );

  const resumeUrl = nextChapter
    ? `/dashboard/trainee/learn/${nextChapter.programId}/${nextChapter.moduleId}/${nextChapter.lessonId}`
    : firstProgramId && firstIncompleteModule
      ? `/dashboard/trainee/learn/${firstProgramId}/${firstIncompleteModule.id}`
      : firstProgramId
        ? `/dashboard/trainee/learn/${firstProgramId}`
        : null;
  const resumeLabel = nextChapter
    ? `Continue: ${nextChapter.title}`
    : firstIncompleteModule
      ? `Continue: ${firstIncompleteModule.title}`
      : firstProgramId
        ? "View course"
        : null;

  return (
    <div className="h-full min-h-0">
      <TraineePlanningContent
        assignments={assignmentItems}
        enrollments={enrollmentItems}
        scheduleItems={scheduleItems}
        userInfo={userInfo}
        resumeUrl={resumeUrl}
        resumeLabel={resumeLabel}
        stats={{
          completedScheduledTasks,
          totalScheduledTasks,
          courseProgressPercent,
          cohortDuration,
        }}
      />
    </div>
  );
}
