import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHomeDataByRole } from "@/lib/dashboardHomeData";
import { DashboardHomeView } from "@/components/dashboard/DashboardHomeView";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  const userId = session.user.id;
  const userName = session.user.name ?? null;

  let data;
  try {
    // Get home data - getTraineeHomeData returns null if no enrollments
    data = await getHomeDataByRole(role, userId, userName);
  } catch (error) {
    console.error("Dashboard error:", error);
    redirect("/login");
  }

  // Trainee with no enrollments: show empty state instead of redirecting
  if (role === "TRAINEE" && !data) {
    const firstName = userName?.split(/\s+/)[0] ?? "Trainee";
    return (
      <div
        className="min-h-full rounded-xl p-6"
        style={{ backgroundColor: "var(--sidebar-bg)" }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">
            Welcome, {firstName}
          </h1>
          <p className="mt-1 text-[#6b7280] dark:text-[#9ca3af]">Your progress and upcoming work.</p>
        </div>
        <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-8 text-center">
          <p className="text-lg font-medium text-[#171717] dark:text-[#f9fafb] mb-2">
            No enrollments yet
          </p>
          <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mb-6">
            You haven't been enrolled in any courses yet. Once you're enrolled in a cohort, you'll see your progress and assignments here.
          </p>
          <Link
            href="/dashboard/trainee/learn"
            className="inline-block rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--unipod-blue)" }}
          >
            View available courses
          </Link>
        </div>
      </div>
    );
  }

  // No data for other roles: redirect to login
  if (!data) redirect("/login");

  // Trainee with data can use same layout; pendingDeliverables already in data.section4
  if (role === "TRAINEE" && data) {
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
