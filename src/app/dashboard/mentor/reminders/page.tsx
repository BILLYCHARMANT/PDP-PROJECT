import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RemindersList } from "@/components/mentor/RemindersList";

export default async function MentorRemindersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "MENTOR" && session.user.role !== "ADMIN")) {
    redirect("/dashboard");
  }
  return (
    <div
      className="min-h-full rounded-xl p-6"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#171717]">Reminders</h1>
        <p className="mt-1 text-[#6b7280]">
          Send reminders to trainees who are at risk (late or having issues with module completion). Flag trainees in Cohorts so they appear here.
        </p>
      </div>
      <RemindersList />
    </div>
  );
}
