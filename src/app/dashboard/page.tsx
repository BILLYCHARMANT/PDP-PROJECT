import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHomeDataByRole } from "@/lib/dashboardHomeData";
import { DashboardHomeView } from "@/components/dashboard/DashboardHomeView";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  const userId = session.user.id;
  const userName = session.user.name ?? null;

  // Trainee with no enrollments: send to learn (no home data)
  if (role === "TRAINEE") {
    const enrollments = await prisma.enrollment.findMany({
      where: { traineeId: userId },
      include: {
        cohort: {
          include: {
            program: {
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
    });
    if (enrollments.length === 0) {
      redirect("/dashboard/trainee/learn");
    }
  }

  const data = await getHomeDataByRole(role, userId, userName);

  // Trainee with data can use same layout; if getTraineeHomeData returns null we already redirected
  if (role === "TRAINEE" && data) {
    const enrollment = (await prisma.enrollment.findMany({
      where: { traineeId: userId },
      include: {
        cohort: {
          include: {
            program: {
              include: {
                modules: { orderBy: { order: "asc" }, include: { assignments: { orderBy: { order: "asc" } } } },
              },
            },
          },
        },
      },
    }))[0];
    const program = enrollment.cohort.program;
    const cohort = enrollment.cohort;
    const allAssignmentIds = program.modules.flatMap((m) => m.assignments.map((a) => a.id));
    const approvedSubmissions = allAssignmentIds.length
      ? await prisma.submission.findMany({
          where: { traineeId: userId, assignmentId: { in: allAssignmentIds }, status: "APPROVED" },
          select: { assignmentId: true },
        })
      : [];
    const approvedSet = new Set(approvedSubmissions.map((s) => s.assignmentId));
    const pendingDeliverables = program.modules.flatMap((m) =>
      m.assignments
        .filter((a) => !approvedSet.has(a.id))
        .map((a) => ({
          id: a.id,
          title: a.title,
          moduleId: m.id,
          moduleTitle: m.title,
          dueDate: a.dueDate?.toISOString() ?? null,
        }))
    ).slice(0, 8);

    // Use same home layout (charts + tables) for trainee
    const sections: [React.ReactNode, React.ReactNode, React.ReactNode, React.ReactNode] = [
      <ul key="s1" className="space-y-2">
        {data.section1.upcomingCohorts.length === 0 ? (
          <li className="text-sm text-[#6b7280] dark:text-[#9ca3af] py-2">No upcoming cohorts.</li>
        ) : (
          data.section1.upcomingCohorts.map((c: { id: string; name: string; programName: string; startDate: Date | null }) => (
            <li key={c.id} className="flex items-center justify-between rounded-lg border border-[#e5e7eb] dark:border-[#374151] px-3 py-2.5 text-sm">
              <span className="text-[#171717] dark:text-[#f9fafb]">{c.programName} – {c.name}</span>
              <span className="text-[#6b7280] dark:text-[#9ca3af]">{c.startDate ? new Date(c.startDate).toLocaleDateString() : "—"}</span>
            </li>
          ))
        )}
      </ul>,
      <ul key="s2" className="space-y-2">
        {data.section2.programsList.length === 0 ? (
          <li className="text-sm text-[#6b7280] dark:text-[#9ca3af] py-2">No modules.</li>
        ) : (
          data.section2.programsList.map((p: { id: string; name: string; status: string }) => (
            <li key={p.id} className="flex items-center justify-between rounded-lg border border-[#e5e7eb] dark:border-[#374151] px-3 py-2.5 text-sm">
              <span className="text-[#171717] dark:text-[#f9fafb]">{p.name}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "ACTIVE" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-[var(--sidebar-bg)] dark:bg-[#374151] text-[#6b7280] dark:text-[#9ca3af]"}`}>{p.status}</span>
            </li>
          ))
        )}
      </ul>,
      <ul key="s3" className="space-y-2">
        {data.section3.recentEnrollments.length === 0 ? (
          <li className="text-sm text-[#6b7280] dark:text-[#9ca3af] py-2">No recent activity.</li>
        ) : (
          data.section3.recentEnrollments.map((s: { id: string; assignment: { title: string }; submittedAt: Date; status: string }) => (
            <li key={s.id} className="flex items-center justify-between rounded-lg border border-[#e5e7eb] dark:border-[#374151] px-3 py-2.5 text-sm">
              <span className="text-[#171717] dark:text-[#f9fafb]">{s.assignment.title}</span>
              <span className="text-[#6b7280] dark:text-[#9ca3af]">{new Date(s.submittedAt).toLocaleDateString()} · {s.status}</span>
            </li>
          ))
        )}
      </ul>,
      <ul key="s4" className="space-y-2">
        {data.section4.pendingDeliverables.length === 0 ? (
          <li className="text-sm text-[#6b7280] dark:text-[#9ca3af] py-2">All caught up.</li>
        ) : (
          data.section4.pendingDeliverables.map((d: { id: string; title: string; programId: string; moduleId: string }) => (
            <li key={d.id} className="flex items-center justify-between rounded-lg border border-[#e5e7eb] dark:border-[#374151] px-3 py-2.5 text-sm">
              <span className="text-[#171717] dark:text-[#f9fafb]">{d.title}</span>
              <Link href={`/dashboard/trainee/learn/${d.programId}/${d.moduleId}/assignment/${d.id}`} className="text-sm font-medium" style={{ color: "var(--unipod-blue)" }}>Start</Link>
            </li>
          ))
        )}
      </ul>,
    ];

    return (
      <DashboardHomeView
        welcome={data.welcome}
        metrics={data.metrics}
        activityData={data.activityData}
        donutData={data.donutData}
        sections={[
          { title: data.section1.title, seeAllHref: data.section1.seeAllHref, content: sections[0] },
          { title: data.section2.title, seeAllHref: data.section2.seeAllHref, content: sections[1] },
          { title: data.section3.title, seeAllHref: data.section3.seeAllHref, content: sections[2] },
          { title: data.section4.title, seeAllHref: data.section4.seeAllHref, content: sections[3] },
        ]}
      />
    );
  }

  if (!data) redirect("/login");

  // Admin and Mentor: same section shapes (upcoming cohorts, programs, recent enrollments, submitted assignments)
  const sections: [React.ReactNode, React.ReactNode, React.ReactNode, React.ReactNode] = [
    <ul key="s1" className="space-y-2">
      {data.section1.upcomingCohorts.length === 0 ? (
        <li className="text-sm text-[#6b7280] dark:text-[#9ca3af] py-2">No upcoming cohorts.</li>
      ) : (
        data.section1.upcomingCohorts.map((c: { id: string; program: { name: string }; name: string; startDate: Date | null }) => (
          <li key={c.id} className="flex items-center justify-between rounded-lg border border-[#e5e7eb] dark:border-[#374151] px-3 py-2.5 text-sm">
            <span className="text-[#171717] dark:text-[#f9fafb]">{c.program.name} – {c.name}</span>
            <span className="text-[#6b7280] dark:text-[#9ca3af]">{c.startDate ? new Date(c.startDate).toLocaleDateString() : "—"}</span>
          </li>
        ))
      )}
    </ul>,
    <ul key="s2" className="space-y-2">
      {data.section2.programsList.length === 0 ? (
        <li className="text-sm text-[#6b7280] dark:text-[#9ca3af] py-2">No modules.</li>
      ) : (
        data.section2.programsList.map((p: { id: string; name: string; status: string }) => (
          <li key={p.id} className="flex items-center justify-between rounded-lg border border-[#e5e7eb] dark:border-[#374151] px-3 py-2.5 text-sm">
            <span className="text-[#171717] dark:text-[#f9fafb]">{p.name}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "ACTIVE" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-[var(--sidebar-bg)] dark:bg-[#374151] text-[#6b7280] dark:text-[#9ca3af]"}`}>{p.status}</span>
          </li>
        ))
      )}
    </ul>,
    <ul key="s3" className="space-y-2">
      {data.section3.recentEnrollments.length === 0 ? (
        <li className="text-sm text-[#6b7280] dark:text-[#9ca3af] py-2">No recent enrollments.</li>
      ) : (
        data.section3.recentEnrollments.map((e: { id: string; trainee: { name: string }; enrolledAt: Date }) => (
          <li key={e.id} className="flex items-center justify-between rounded-lg border border-[#e5e7eb] dark:border-[#374151] px-3 py-2.5 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[var(--unipod-blue-light)] dark:bg-[#374151] flex items-center justify-center text-xs font-semibold" style={{ color: "var(--unipod-blue)" }}>{e.trainee.name.slice(0, 2).toUpperCase()}</div>
              <span className="text-[#171717] dark:text-[#f9fafb]">{e.trainee.name}</span>
            </div>
            <span className="text-[#6b7280] dark:text-[#9ca3af]">{new Date(e.enrolledAt).toLocaleDateString()}</span>
          </li>
        ))
      )}
    </ul>,
    <ul key="s4" className="space-y-2">
      {data.section4.submittedAssignmentsList.length === 0 ? (
        <li className="text-sm text-[#6b7280] dark:text-[#9ca3af] py-2">No submitted assignments.</li>
      ) : (
        data.section4.submittedAssignmentsList.map((a: { id: string; title: string; count: number }) => (
          <li key={a.id} className="flex items-center justify-between rounded-lg border border-[#e5e7eb] dark:border-[#374151] px-3 py-2.5 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[var(--unipod-blue-light)] dark:bg-[#374151] flex items-center justify-center text-xs font-semibold" style={{ color: "var(--unipod-blue)" }}>{a.title.slice(0, 1).toUpperCase()}</div>
              <span className="text-[#171717] dark:text-[#f9fafb]">{a.title}</span>
            </div>
            <span className="text-[#6b7280] dark:text-[#9ca3af]">{a.count} submitted</span>
          </li>
        ))
      )}
    </ul>,
  ];

  return (
    <DashboardHomeView
      welcome={data.welcome}
      metrics={data.metrics}
      activityData={data.activityData}
      donutData={data.donutData}
      approvalRequests={"approvalRequests" in data ? data.approvalRequests : undefined}
      sections={[
        { title: data.section1.title, seeAllHref: data.section1.seeAllHref, content: sections[0] },
        { title: data.section2.title, seeAllHref: data.section2.seeAllHref, content: sections[1] },
        { title: data.section3.title, seeAllHref: data.section3.seeAllHref, content: sections[2] },
        { title: data.section4.title, seeAllHref: data.section4.seeAllHref, content: sections[3] },
      ]}
    />
  );
}
