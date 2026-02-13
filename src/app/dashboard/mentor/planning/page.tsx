import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MentorPlanningContent } from "@/components/mentor/MentorPlanningContent";
import type { ScheduleItemType } from "@/components/trainee/PlanningScheduledTasksList";

export default async function MentorPlanningPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "MENTOR" && session.user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  const userId = session.user.id;

  const [events, cohorts, modules, assignments] = await Promise.all([
    prisma.traineeScheduledEvent.findMany({
      where: { mentorId: userId },
      orderBy: { date: "asc" },
      include: {
        trainee: { select: { id: true, name: true, email: true } },
        mentor: { select: { name: true } },
        module: { select: { title: true } },
        lesson: { select: { title: true } },
      },
    }),
    prisma.cohort.findMany({
      where: { mentorId: userId, programId: { not: null } },
      include: { program: { select: { id: true, name: true } } },
    }),
    prisma.module.findMany({
      where: { course: { program: { cohorts: { some: { mentorId: userId } } } } },
      include: { course: { include: { program: { select: { id: true, name: true } } } } },
    }),
    prisma.assignment.findMany({
      where: { module: { course: { program: { cohorts: { some: { mentorId: userId } } } } } },
      include: {
        module: { select: { id: true, title: true, course: { include: { program: { select: { id: true, name: true } } } } } },
      },
    }),
  ]);

  const programIds = [...new Set(cohorts.map((c) => c.programId).filter(Boolean))] as string[];
  const todayStr = new Date().toISOString().slice(0, 10);

  const requestsForMentor = events.map((r) => ({
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

  const scheduleItems: {
    id: string;
    type: ScheduleItemType;
    date: string;
    label: string;
    programName?: string;
    moduleTitle?: string;
    href?: string;
    programId?: string;
    dueDateTime?: string;
  }[] = [];

  for (const programId of programIds) {
    const programName = cohorts.find((c) => c.programId === programId)?.program?.name ?? "Course";
    scheduleItems.push({
      id: `course-${programId}`,
      type: "course_start",
      date: todayStr,
      label: programName,
      programName,
      programId,
      href: "/dashboard/mentor/programs",
    });
  }

  for (const m of modules) {
    const programId = m.course?.programId ?? undefined;
    const programName = m.course?.program?.name ?? "Course";
    if (m.startDate) {
      const d = new Date(m.startDate);
      scheduleItems.push({
        id: `module-start-${m.id}`,
        type: "module_start",
        date: d.toISOString().slice(0, 10),
        label: `${programName}: ${m.title} start`,
        programName,
        moduleTitle: m.title,
        href: "/dashboard/mentor/programs",
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
        href: "/dashboard/mentor/programs",
      });
    }
  }

  for (const a of assignments) {
    const programId = a.module.course?.program?.id;
    const programName = a.module.course?.program?.name ?? "Course";
    if (!programId) continue;
    const moduleId = a.module.id;
    if (a.dueDate) {
      const d = new Date(a.dueDate);
      scheduleItems.push({
        id: `assignment-${a.id}`,
        type: "assignment_due",
        date: d.toISOString().slice(0, 10),
        label: a.title,
        programName,
        moduleTitle: a.module.title,
        href: `/dashboard/admin/programs/${programId}/modules/${moduleId}/assignments/${a.id}`,
        dueDateTime: d.toISOString(),
      });
    }
  }

  scheduleItems.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-4 md:p-6">
      <MentorPlanningContent
        requests={requestsForMentor}
        scheduleItems={scheduleItems}
      />
    </div>
  );
}
