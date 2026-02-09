import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MentorSubmissions } from "@/components/mentor/MentorSubmissions";

export default async function MentorSubmissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "MENTOR" && session.user.role !== "ADMIN")) {
    redirect("/dashboard");
  }
  return (
    <div
      className="min-h-full rounded-xl p-6"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">Submissions</h1>
          <p className="mt-1 text-[#6b7280] dark:text-[#9ca3af]">
            Review and assess trainee submissions. Approve, reject, or request resubmission.
          </p>
        </div>
        <Link
          href="/dashboard/mentor/submissions/grade"
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--unipod-blue)" }}
        >
          Open grading
        </Link>
      </div>
      <MentorSubmissions />
    </div>
  );
}
