import { getServerSession } from "next-auth";
import { ScheduleEventType, ScheduleRequestStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function MentorTechnicalSupportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "MENTOR" && session.user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  const requests = await prisma.traineeScheduledEvent.findMany({
    where: { mentorId: session.user.id, eventType: "MENTOR_MEETING" },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    include: {
      trainee: { select: { id: true, name: true, email: true } },
    },
  });

  const pending = requests.filter((r) => r.status === ScheduleRequestStatus.PENDING);
  const approved = requests.filter((r) => r.status === ScheduleRequestStatus.APPROVED);
  const rejected = requests.filter((r) => r.status === ScheduleRequestStatus.REJECTED);

  function formatDate(d: Date) {
    return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }
  function timeRange(r: { startTime: string | null; endTime: string | null }) {
    if (!r.startTime) return "—";
    return r.endTime ? `${r.startTime} – ${r.endTime}` : r.startTime;
  }

  return (
    <div
      className="min-h-full rounded-xl p-6"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">Technical support requests</h1>
        <p className="mt-1 text-[#6b7280] dark:text-[#9ca3af]">
          View only. Students from your cohorts who requested to meet you. Admin approves requests for reception pass.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#9ca3af]">Pending</p>
          <p className="mt-1 text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">{pending.length}</p>
          <p className="text-xs text-[#6b7280] dark:text-[#9ca3af]">Awaiting admin approval</p>
        </div>
        <div className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#9ca3af]">Approved</p>
          <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{approved.length}</p>
          <p className="text-xs text-[#6b7280] dark:text-[#9ca3af]">Reception pass issued</p>
        </div>
        <div className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#9ca3af]">Rejected</p>
          <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{rejected.length}</p>
          <p className="text-xs text-[#6b7280] dark:text-[#9ca3af]">Not approved</p>
        </div>
      </div>

      <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb] mb-3">All requests</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] py-4">No technical support requests yet.</p>
        ) : (
          <ul className="space-y-3">
            {requests.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                      r.status === "PENDING"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        : r.status === "APPROVED"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="mt-2 font-medium text-[#171717] dark:text-[#f9fafb]">
                  {r.trainee.name || r.trainee.email || "Trainee"}
                </p>
                <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">
                  {formatDate(r.date)}
                  {timeRange(r) !== "—" ? ` · ${timeRange(r)}` : ""}
                </p>
                {r.location && (
                  <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mt-0.5">Location: {r.location}</p>
                )}
                {r.description && (
                  <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mt-1">{r.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 text-sm text-[#6b7280] dark:text-[#9ca3af]">
        View only. You cannot approve or reject; admin approves requests for reception pass.
      </p>
    </div>
  );
}
