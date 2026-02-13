"use server";

import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import {
  ProgramStatus,
  SubmissionStatus,
  ScheduleRequestStatus,
  ScheduleEventType,
} from "@prisma/client";

const DEFAULT_DONUT = [{ name: "No submissions", value: 1, color: "#e5e7eb" }];

function buildActivityDays(submissionWhere: object) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: { date: Date; label: string }[] = [];
  for (let i = 8; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({
      date: d,
      label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    });
  }
  return days;
}

export type ApprovalRequestCard = { label: string; count: number; href: string; color: "orange" | "green" };

export async function getAdminHomeData(userId: string, userName: string | null) {
  const submissionWhere = {};
  const [
    programCount,
    enrollmentCount,
    traineeCount,
    pendingCount,
    accessRequestsCount,
    attendingCourseCount,
    technicalSupportCount,
    courseApprovalCount,
  ] = await Promise.all([
    prisma.program.count(),
    prisma.enrollment.count(),
    prisma.user.count({ where: { role: "TRAINEE" } }),
    prisma.submission.count({ where: { status: SubmissionStatus.PENDING } }),
    prisma.traineeScheduledEvent.count({ where: { status: ScheduleRequestStatus.PENDING, eventType: ScheduleEventType.LAB_WORKSHOP } }),
    prisma.traineeScheduledEvent.count({ where: { status: ScheduleRequestStatus.PENDING, eventType: ScheduleEventType.COURSE_SCHEDULE } }),
    prisma.traineeScheduledEvent.count({ where: { status: ScheduleRequestStatus.PENDING, eventType: ScheduleEventType.MENTOR_MEETING } }),
    prisma.course.count({ where: { status: ProgramStatus.PENDING } }),
  ]);

  const scheduleHref = "/dashboard/admin/schedule-requests";
  const approvalRequests: ApprovalRequestCard[] = [
    { label: "Access requests", count: accessRequestsCount, href: scheduleHref, color: "orange" },
    { label: "Attending course request", count: attendingCourseCount, href: scheduleHref, color: "green" },
    { label: "Technical support request", count: technicalSupportCount, href: scheduleHref, color: "orange" },
    { label: "Course approval request from mentor", count: courseApprovalCount, href: "/dashboard/admin/programs", color: "green" },
  ];

  const days = buildActivityDays(submissionWhere);
  const submissionsByDay = await Promise.all(
    days.map(async (day) => {
      const next = new Date(day.date);
      next.setDate(next.getDate() + 1);
      const count = await prisma.submission.count({
        where: { submittedAt: { gte: day.date, lt: next } },
      });
      return { ...day, count };
    })
  );
  const activityData = days.map((d) => {
    const found = submissionsByDay.find((s) => s.date.getTime() === d.date.getTime());
    return { date: d.date.toISOString(), label: d.label, count: found?.count ?? 0 };
  });

  const [pending, approved, rejected, resubmit] = await Promise.all([
    prisma.submission.count({ where: { status: SubmissionStatus.PENDING } }),
    prisma.submission.count({ where: { status: SubmissionStatus.APPROVED } }),
    prisma.submission.count({ where: { status: SubmissionStatus.REJECTED } }),
    prisma.submission.count({ where: { status: SubmissionStatus.RESUBMIT_REQUESTED } }),
  ]);
  const donutData = [
    { name: "Pending", value: pending, color: "#0066cc" },
    { name: "Approved", value: approved, color: "#00c853" },
    { name: "Rejected", value: rejected, color: "#dc2626" },
    { name: "Resubmit", value: resubmit, color: "#facc15" },
  ].filter((d) => d.value > 0);
  if (donutData.length === 0) donutData.push(...DEFAULT_DONUT);

  const upcomingCohorts = await prisma.cohort.findMany({
    include: { program: { select: { name: true } } },
    orderBy: { startDate: "asc" },
    take: 5,
  });
  const programsList = await prisma.program.findMany({
    select: { id: true, name: true, status: true },
    orderBy: { name: "asc" },
    take: 5,
  });
  const recentEnrollments = await prisma.enrollment.findMany({
    include: {
      trainee: { select: { name: true } },
      cohort: { include: { program: { select: { name: true } } } },
    },
    orderBy: { enrolledAt: "desc" },
    take: 5,
  });
  const assignmentSubmissions = await prisma.submission.groupBy({
    by: ["assignmentId"],
    _count: { id: true },
  });
  const assignmentIds = assignmentSubmissions.map((a) => a.assignmentId);
  const assignmentsWithCount =
    assignmentIds.length > 0
      ? await prisma.assignment.findMany({
          where: { id: { in: assignmentIds } },
          select: { id: true, title: true },
        })
      : [];
  const submittedAssignmentsList = (
    assignmentSubmissions
      .map((a) => {
        const ass = assignmentsWithCount.find((x) => x.id === a.assignmentId);
        return ass ? { id: ass.id, title: ass.title, count: a._count.id } : null;
      })
      .filter(Boolean) as { id: string; title: string; count: number }[]
  )
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const firstName = userName?.split(/\s+/)[0] ?? "Admin";
  return {
    welcome: { firstName, subtitle: "System-wide overview and statistics." },
    approvalRequests,
    metrics: [
      { label: "Total Modules", value: programCount },
      { label: "Total Enrollment", value: enrollmentCount },
      { label: "Total Trainees", value: traineeCount },
      { label: "Pending Review", value: pendingCount },
    ],
    activityData,
    donutData,
    section1: { title: "Upcoming", seeAllHref: "/dashboard/admin/cohorts", upcomingCohorts },
    section2: { title: "Modules", seeAllHref: "/dashboard/admin/programs", programsList },
    section3: { title: "Recent enrollment", seeAllHref: "/dashboard/admin/cohorts", recentEnrollments },
    section4: { title: "Submitted assignments", seeAllHref: "/dashboard/mentor/submissions", submittedAssignmentsList },
  };
}

export async function getMentorHomeData(userId: string, userName: string | null) {
  const cohortWhere = { mentorId: userId };
  const cohortIds = (
    await prisma.cohort.findMany({ where: cohortWhere, select: { id: true } })
  ).map((c) => c.id);
  const programIds = cohortIds.length
    ? [...new Set((await prisma.cohort.findMany({ where: { id: { in: cohortIds } }, select: { programId: true } })).map((c) => c.programId).filter((id): id is string => id != null))]
    : [];
  const traineeIdsInCohorts =
    cohortIds.length > 0
      ? (await prisma.enrollment.findMany({ where: { cohortId: { in: cohortIds } }, select: { traineeId: true } })).map((e) => e.traineeId)
      : [];
  const assignmentIdsInPrograms =
    programIds.length > 0
      ? (await prisma.assignment.findMany({ where: { module: { course: { programId: { in: programIds } } } }, select: { id: true } })).map((a) => a.id)
      : [];
  // Build submission where clause - avoid IN (NULL) by only using 'in' when array has items
  const submissionWhereBase = traineeIdsInCohorts.length > 0 
    ? { traineeId: { in: traineeIdsInCohorts } }
    : {};

  const [programCount, enrollmentCount, traineeCount, pendingCount, technicalSupportCount] = await Promise.all([
    programIds.length > 0 ? prisma.program.count({ where: { id: { in: programIds } } }) : 0,
    cohortIds.length > 0 ? prisma.enrollment.count({ where: { cohortId: { in: cohortIds } } }) : 0,
    traineeIdsInCohorts.length > 0 ? prisma.user.count({ where: { id: { in: [...new Set(traineeIdsInCohorts)] }, role: "TRAINEE" } }) : 0,
    traineeIdsInCohorts.length > 0 ? prisma.submission.count({ where: { ...submissionWhereBase, status: SubmissionStatus.PENDING } }) : 0,
    prisma.traineeScheduledEvent.count({ where: { mentorId: userId, eventType: ScheduleEventType.MENTOR_MEETING, status: ScheduleRequestStatus.PENDING } }),
  ]);

  const days = buildActivityDays(submissionWhereBase);
  const submissionsByDay = traineeIdsInCohorts.length > 0
    ? await Promise.all(
        days.map(async (day) => {
          const next = new Date(day.date);
          next.setDate(next.getDate() + 1);
          const count = await prisma.submission.count({
            where: { ...submissionWhereBase, submittedAt: { gte: day.date, lt: next } },
          });
          return { ...day, count };
        })
      )
    : days.map((d) => ({ ...d, count: 0 }));
  const activityData = days.map((d) => {
    const found = submissionsByDay.find((s) => s.date.getTime() === d.date.getTime());
    return { date: d.date.toISOString(), label: d.label, count: found?.count ?? 0 };
  });

  const [pending, approved, rejected, resubmit] = traineeIdsInCohorts.length > 0
    ? await Promise.all([
        prisma.submission.count({ where: { ...submissionWhereBase, status: SubmissionStatus.PENDING } }),
        prisma.submission.count({ where: { ...submissionWhereBase, status: SubmissionStatus.APPROVED } }),
        prisma.submission.count({ where: { ...submissionWhereBase, status: SubmissionStatus.REJECTED } }),
        prisma.submission.count({ where: { ...submissionWhereBase, status: SubmissionStatus.RESUBMIT_REQUESTED } }),
      ])
    : [0, 0, 0, 0];
  const donutData = [
    { name: "Pending", value: pending, color: "#0066cc" },
    { name: "Approved", value: approved, color: "#00c853" },
    { name: "Rejected", value: rejected, color: "#dc2626" },
    { name: "Resubmit", value: resubmit, color: "#facc15" },
  ].filter((d) => d.value > 0);
  if (donutData.length === 0) donutData.push(...DEFAULT_DONUT);

  const mentorApprovalRequests: ApprovalRequestCard[] = [
    { label: "Submissions pending review", count: pendingCount, href: "/dashboard/mentor/submissions", color: "orange" },
    { label: "Resubmit requested", count: resubmit, href: "/dashboard/mentor/submissions", color: "green" },
    { label: "Technical support requests", count: technicalSupportCount, href: "/dashboard/mentor/technical-support", color: "orange" },
  ];

  const upcomingCohorts = await prisma.cohort.findMany({
    where: cohortIds.length ? { id: { in: cohortIds } } : {},
    include: { program: { select: { name: true } } },
    orderBy: { startDate: "asc" },
    take: 5,
  });
  const programsList = await prisma.program.findMany({
    where: programIds.length ? { id: { in: programIds } } : undefined,
    select: { id: true, name: true, status: true },
    orderBy: { name: "asc" },
    take: 5,
  });
  const recentEnrollments = await prisma.enrollment.findMany({
    where: cohortIds.length ? { cohortId: { in: cohortIds } } : {},
    include: {
      trainee: { select: { name: true } },
      cohort: { include: { program: { select: { name: true } } } },
    },
    orderBy: { enrolledAt: "desc" },
    take: 5,
  });
  const assignmentSubmissions =
    assignmentIdsInPrograms.length > 0
      ? await prisma.submission.groupBy({
          by: ["assignmentId"],
          where: { assignmentId: { in: assignmentIdsInPrograms } },
          _count: { id: true },
        })
      : [];
  const assignmentIds = assignmentSubmissions.map((a) => a.assignmentId);
  const assignmentsWithCount =
    assignmentIds.length > 0
      ? await prisma.assignment.findMany({
          where: { id: { in: assignmentIds } },
          select: { id: true, title: true },
        })
      : [];
  const submittedAssignmentsList = (
    assignmentSubmissions
      .map((a) => {
        const ass = assignmentsWithCount.find((x) => x.id === a.assignmentId);
        return ass ? { id: ass.id, title: ass.title, count: a._count.id } : null;
      })
      .filter(Boolean) as { id: string; title: string; count: number }[]
  )
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const firstName = userName?.split(/\s+/)[0] ?? "Mentor";
  return {
    welcome: { firstName, subtitle: "Overview and statistics for your program based on trainees." },
    approvalRequests: mentorApprovalRequests,
    metrics: [
      { label: "Total Modules", value: programCount },
      { label: "Total Enrollment", value: enrollmentCount },
      { label: "Total Trainees", value: traineeCount },
      { label: "Pending Review", value: pendingCount },
    ],
    activityData,
    donutData,
    section1: { title: "Upcoming", seeAllHref: "/dashboard/mentor/programs", upcomingCohorts },
    section2: { title: "Modules", seeAllHref: "/dashboard/mentor/programs", programsList },
    section3: { title: "Recent enrollment", seeAllHref: "/dashboard/mentor/reminders", recentEnrollments },
    section4: { title: "Submitted assignments", seeAllHref: "/dashboard/mentor/submissions", submittedAssignmentsList },
  };
}

export async function getTraineeHomeData(userId: string, userName: string | null) {
  const enrollments = await prisma.enrollment.findMany({
    where: { traineeId: userId },
    include: {
      cohort: {
        include: {
          program: {
            include: {
              courses: {
                include: {
                  modules: {
                    orderBy: { order: "asc" },
                    include: { assignments: { orderBy: { order: "asc" } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (enrollments.length === 0) {
    return null;
  }
  const program = enrollments[0].cohort.program;
  if (!program) return null;
  const allModules = program.courses.flatMap((c) => c.modules);
  const allAssignmentIds = allModules.flatMap((m) => m.assignments.map((a) => a.id));
  const approvedSubmissions = allAssignmentIds.length
    ? await prisma.submission.findMany({
        where: { traineeId: userId, assignmentId: { in: allAssignmentIds }, status: SubmissionStatus.APPROVED },
        select: { assignmentId: true },
      })
    : [];
  const approvedSet = new Set(approvedSubmissions.map((s) => s.assignmentId));
  const programId = program.id;
  const pendingDeliverables = allModules.flatMap((m) =>
    m.assignments
      .filter((a) => !approvedSet.has(a.id))
      .map((a) => ({ id: a.id, title: a.title, programId, moduleId: m.id, moduleTitle: m.title }))
  );

  const submissionWhere = { traineeId: userId };
  const [moduleCount, enrollmentCount, pendingCount, approvedCount] = await Promise.all([
    Promise.resolve(allModules.length),
    Promise.resolve(enrollments.length),
    Promise.resolve(pendingDeliverables.length),
    prisma.submission.count({ where: { traineeId: userId, status: SubmissionStatus.APPROVED } }),
  ]);

  const days = buildActivityDays(submissionWhere);
  const submissionsByDay = await Promise.all(
    days.map(async (day) => {
      const next = new Date(day.date);
      next.setDate(next.getDate() + 1);
      const count = await prisma.submission.count({
        where: { traineeId: userId, submittedAt: { gte: day.date, lt: next } },
      });
      return { ...day, count };
    })
  );
  const activityData = days.map((d) => {
    const found = submissionsByDay.find((s) => s.date.getTime() === d.date.getTime());
    return { date: d.date.toISOString(), label: d.label, count: found?.count ?? 0 };
  });

  const [pending, approved, rejected, resubmit] = await Promise.all([
    prisma.submission.count({ where: { traineeId: userId, status: SubmissionStatus.PENDING } }),
    prisma.submission.count({ where: { traineeId: userId, status: SubmissionStatus.APPROVED } }),
    prisma.submission.count({ where: { traineeId: userId, status: SubmissionStatus.REJECTED } }),
    prisma.submission.count({ where: { traineeId: userId, status: SubmissionStatus.RESUBMIT_REQUESTED } }),
  ]);
  const donutData = [
    { name: "Pending", value: pending, color: "#0066cc" },
    { name: "Approved", value: approved, color: "#00c853" },
    { name: "Rejected", value: rejected, color: "#dc2626" },
    { name: "Resubmit", value: resubmit, color: "#facc15" },
  ].filter((d) => d.value > 0);
  if (donutData.length === 0) donutData.push(...DEFAULT_DONUT);

  const recentSubmissions = await prisma.submission.findMany({
    where: { traineeId: userId },
    include: { assignment: { select: { title: true } } },
    orderBy: { submittedAt: "desc" },
    take: 5,
  });
  const upcomingCohorts = enrollments.map((e) => ({
    id: e.id,
    name: e.cohort.name,
    programName: e.cohort.program?.name ?? "Course",
    startDate: e.cohort.startDate,
  }));
  const programsList = [{ id: program.id, name: program.name, status: program.status }];
  const firstName = userName?.split(/\s+/)[0] ?? "Trainee";

  return {
    welcome: { firstName, subtitle: "Your progress and upcoming work." },
    metrics: [
      { label: "My Modules", value: moduleCount },
      { label: "Enrollment", value: enrollmentCount },
      { label: "Pending deliverables", value: pendingCount },
      { label: "Approved", value: approvedCount },
    ],
    activityData,
    donutData,
    section1: { title: "Upcoming", seeAllHref: "/dashboard/trainee/learn", upcomingCohorts },
    section2: { title: "My modules", seeAllHref: "/dashboard/trainee/learn", programsList },
    section3: { title: "Recent activity", seeAllHref: "/dashboard/trainee/evaluations", recentEnrollments: recentSubmissions },
    section4: { title: "My deliverables", seeAllHref: "/dashboard/trainee/learn", pendingDeliverables },
  };
}


export async function getHomeDataByRole(
  role: Role,
  userId: string,
  userName: string | null
) {
  if (role === "ADMIN") return getAdminHomeData(userId, userName);
  if (role === "MENTOR") return getMentorHomeData(userId, userName);
  if (role === "TRAINEE") return getTraineeHomeData(userId, userName);
  return null;
}
