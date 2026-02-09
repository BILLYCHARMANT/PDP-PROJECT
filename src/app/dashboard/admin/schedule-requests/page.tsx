import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminScheduleApprovalsContent } from "@/components/admin/AdminScheduleApprovalsContent";

type ScheduleItemType =
  | "course_start"
  | "course_end"
  | "module_start"
  | "module_end"
  | "assignment_due";

export default async function AdminScheduleRequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [requests, cohorts, modules, assignments, submissionCounts, totalTrainees, enrollmentsWithCohort, approvedSubmissions, allSubmissions, todayEvents] = await Promise.all([
    prisma.traineeScheduledEvent.findMany({
      orderBy: { date: "asc" },
      include: {
        trainee: { select: { id: true, name: true, email: true, imageUrl: true } },
        mentor: { select: { name: true } },
        module: { select: { title: true } },
        lesson: { select: { title: true } },
      },
    }),
    prisma.cohort.findMany({
      where: { programId: { not: null } },
      include: { program: { select: { id: true, name: true } } },
    }),
    prisma.module.findMany({
      include: { program: { select: { id: true, name: true } } },
    }),
    prisma.assignment.findMany({
      include: {
        module: { include: { program: { select: { id: true, name: true } } } },
      },
    }),
    prisma.submission.groupBy({
      by: ["assignmentId", "status"],
      _count: true,
    }),
    prisma.user.count({ where: { role: "TRAINEE" } }),
    prisma.enrollment.findMany({
      include: {
        cohort: { select: { programId: true } },
        trainee: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.submission.findMany({
      where: { status: "APPROVED" },
      select: { assignmentId: true, traineeId: true },
    }),
    prisma.submission.findMany({
      select: { assignmentId: true, traineeId: true },
    }),
    prisma.traineeScheduledEvent.findMany({
      where: { date: { gte: startOfToday, lt: endOfToday }, status: "APPROVED" },
      select: { traineeId: true },
    }),
  ]);

  const statusOrder = { PENDING: 0, APPROVED: 1, REJECTED: 2 };
  requests.sort(
    (a, b) =>
      statusOrder[a.status as keyof typeof statusOrder] -
        statusOrder[b.status as keyof typeof statusOrder] ||
      new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const subCountByAssignment: Record<string, { pending: number; approved: number }> = {};
  for (const row of submissionCounts) {
    if (!subCountByAssignment[row.assignmentId])
      subCountByAssignment[row.assignmentId] = { pending: 0, approved: 0 };
    if (row.status === "PENDING") subCountByAssignment[row.assignmentId].pending = row._count;
    if (row.status === "APPROVED") subCountByAssignment[row.assignmentId].approved = row._count;
  }

  const todayTraineeIds = new Set(todayEvents.map((e) => e.traineeId));
  const programStats: Record<
    string,
    { enrolledCount: number; enrolledTraineeIds: Set<string>; todayScheduledCount: number }
  > = {};
  for (const e of enrollmentsWithCohort) {
    const programId = e.cohort.programId;
    if (!programId) continue;
    if (!programStats[programId]) {
      programStats[programId] = { enrolledCount: 0, enrolledTraineeIds: new Set(), todayScheduledCount: 0 };
    }
    programStats[programId].enrolledTraineeIds.add(e.traineeId);
  }
  for (const programId of Object.keys(programStats)) {
    const s = programStats[programId];
    s.enrolledCount = s.enrolledTraineeIds.size;
    s.todayScheduledCount = [...s.enrolledTraineeIds].filter((id) => todayTraineeIds.has(id)).length;
  }

  const eventsByDate: Record<string, { traineeId: string; trainee: { id: string; name: string | null; email: string | null } }[]> = {};
  for (const r of requests) {
    const dateStr = new Date(r.date).toISOString().slice(0, 10);
    if (!eventsByDate[dateStr]) eventsByDate[dateStr] = [];
    eventsByDate[dateStr].push({ traineeId: r.traineeId, trainee: r.trainee });
  }

  const enrolledTraineesByProgram: Record<string, { id: string; name: string | null; email: string | null }[]> = {};
  for (const e of enrollmentsWithCohort) {
    const programId = e.cohort.programId;
    if (!programId || !e.trainee) continue;
    if (!enrolledTraineesByProgram[programId]) enrolledTraineesByProgram[programId] = [];
    const exists = enrolledTraineesByProgram[programId].some((t) => t.id === e.trainee!.id);
    if (!exists) enrolledTraineesByProgram[programId].push(e.trainee);
  }

  const completedTraineeIdsByAssignment: Record<string, Set<string>> = {};
  for (const s of approvedSubmissions) {
    if (!completedTraineeIdsByAssignment[s.assignmentId])
      completedTraineeIdsByAssignment[s.assignmentId] = new Set();
    completedTraineeIdsByAssignment[s.assignmentId].add(s.traineeId);
  }

  const submittedTraineeIdsByAssignment: Record<string, Set<string>> = {};
  for (const s of allSubmissions) {
    if (!submittedTraineeIdsByAssignment[s.assignmentId])
      submittedTraineeIdsByAssignment[s.assignmentId] = new Set();
    submittedTraineeIdsByAssignment[s.assignmentId].add(s.traineeId);
  }

  const scheduleItems: {
    id: string;
    type: ScheduleItemType;
    date: string;
    label: string;
    programName?: string;
    moduleTitle?: string;
    href?: string;
    programId?: string;
    scheduledTraineesForDay?: { id: string; name: string | null; email: string | null }[];
    enrolledTraineesWithStatus?: { id: string; name: string | null; email: string | null; submitted: boolean }[];
    enrolledTrainees?: { id: string; name: string | null; email: string | null }[];
    dueDateTime?: string;
  }[] = [];

  // One course card per program for admin (always visible, with 3hr booking stats)
  const programIdsFromCohorts = [...new Set(cohorts.map((c) => c.programId).filter(Boolean))] as string[];
  const programIdsFromModules = [...new Set(modules.map((m) => m.programId))];
  const uniqueProgramIds = [...new Set([...programIdsFromCohorts, ...programIdsFromModules])];
  const todayStr = new Date().toISOString().slice(0, 10);
  for (const programId of uniqueProgramIds) {
    const programName =
      cohorts.find((c) => c.programId === programId)?.program?.name ??
      modules.find((m) => m.programId === programId)?.program?.name ??
      "Course";
    const enrolledTrainees = enrolledTraineesByProgram[programId] ?? [];
    const stats = programStats[programId];
    const todayScheduledCount = stats?.todayScheduledCount ?? 0;
    const enrolledCount = enrolledTrainees.length;
    const scheduledTraineesForToday =
      stats?.enrolledTraineeIds && todayTraineeIds
        ? enrolledTrainees.filter((t) => todayTraineeIds.has(t.id))
        : [];
    const courseSubtitle = `${enrolledCount} enrolled · ${todayScheduledCount} scheduled for today (3hr)`;
    scheduleItems.push({
      id: `course-${programId}`,
      type: "course_start",
      date: todayStr,
      label: programName,
      programName,
      programId,
      href: `/dashboard/admin/programs/${programId}`,
      enrolledTrainees,
      moduleTitle: courseSubtitle,
      scheduledTraineesForDay: scheduledTraineesForToday,
    });
  }

  // Optional: cohort start/end dates as separate timeline items (keep for reference)
  for (const c of cohorts.filter((c) => c.programId && c.program)) {
    const programId = c.programId!;
    const programName = c.program!.name;
    const enrolledTrainees = enrolledTraineesByProgram[programId] ?? [];
    const stats = programStats[programId];
    const todayScheduledCount = stats?.todayScheduledCount ?? 0;
    const enrolledCount = enrolledTrainees.length;
    const scheduledTraineesForToday =
      stats?.enrolledTraineeIds && todayTraineeIds
        ? enrolledTrainees.filter((t) => todayTraineeIds.has(t.id))
        : [];
    const courseSubtitle = `${enrolledCount} enrolled · ${todayScheduledCount} scheduled for today (3hr)`;
    if (c.startDate) {
      const d = new Date(c.startDate);
      scheduleItems.push({
        id: `course-start-${c.id}`,
        type: "course_start",
        date: d.toISOString().slice(0, 10),
        label: `${programName} start`,
        programName,
        programId,
        href: `/dashboard/admin/programs/${programId}`,
        enrolledTrainees,
        moduleTitle: courseSubtitle,
        scheduledTraineesForDay: scheduledTraineesForToday,
      });
    }
    if (c.endDate) {
      const d = new Date(c.endDate);
      scheduleItems.push({
        id: `course-end-${c.id}`,
        type: "course_end",
        date: d.toISOString().slice(0, 10),
        label: `${programName} end`,
        programName,
        programId,
        href: `/dashboard/admin/programs/${programId}`,
        enrolledTrainees,
        moduleTitle: courseSubtitle,
        scheduledTraineesForDay: scheduledTraineesForToday,
      });
    }
  }

  for (const m of modules) {
    const programId = m.programId;
    const programName = m.program.name;
    if (m.startDate) {
      const d = new Date(m.startDate);
      scheduleItems.push({
        id: `module-start-${m.id}`,
        type: "module_start",
        date: d.toISOString().slice(0, 10),
        label: `${programName}: ${m.title} start`,
        programName,
        moduleTitle: m.title,
        href: `/dashboard/admin/programs/${programId}/modules/${m.id}`,
      });
    }
    if (m.endDate) {
      const d = new Date(m.endDate);
      scheduleItems.push({
        id: `module-end-${m.id}`,
        type: "module_end",
        date: d.toISOString().slice(0, 10),
        label: `${programName}: ${m.title} end`,
        programName,
        moduleTitle: m.title,
        href: `/dashboard/admin/programs/${programId}/modules/${m.id}`,
      });
    }
  }

  for (const a of assignments) {
    const programId = a.module.programId;
    const moduleId = a.module.id;
    const programName = a.module.program?.name;
    const stats = programStats[programId];
    if (a.dueDate) {
      const d = new Date(a.dueDate);
      const dateStr = d.toISOString().slice(0, 10);
      const enrolledTraineesList = enrolledTraineesByProgram[programId] ?? [];
      const submittedSet = submittedTraineeIdsByAssignment[a.id];
      const enrolledTraineesWithStatus = enrolledTraineesList.map((t) => ({
        ...t,
        submitted: submittedSet?.has(t.id) ?? false,
      }));
      const submittedCount = enrolledTraineesWithStatus.filter((t) => t.submitted).length;
      const notSubmittedCount = enrolledTraineesWithStatus.length - submittedCount;
      const subtitle = `${submittedCount} submitted · ${notSubmittedCount} not submitted`;
      scheduleItems.push({
        id: `assignment-${a.id}`,
        type: "assignment_due",
        date: dateStr,
        label: a.title,
        programName,
        moduleTitle: subtitle,
        href: `/dashboard/admin/programs/${programId}/modules/${moduleId}/assignments/${a.id}`,
        enrolledTraineesWithStatus,
        dueDateTime: d.toISOString(),
      });
    }
  }

  scheduleItems.sort((a, b) => a.date.localeCompare(b.date));

  const requestsForAdmin = requests.map((r) => ({
    id: r.id,
    date: r.date,
    startTime: r.startTime,
    endTime: r.endTime,
    eventType: r.eventType,
    location: r.location,
    status: r.status,
    requestCoffee: r.requestCoffee,
    description: r.description,
    equipmentNeeded: r.equipmentNeeded,
    teamMembers: r.teamMembers,
    trainee: r.trainee,
    mentor: r.mentor,
    moduleTitle: r.module?.title ?? null,
    lessonTitle: r.lesson?.title ?? null,
  }));

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-4 md:p-6">
      <AdminScheduleApprovalsContent
        requests={requestsForAdmin}
        scheduleItems={scheduleItems}
      />
    </div>
  );
}
