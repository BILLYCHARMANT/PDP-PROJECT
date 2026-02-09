import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#171717]">Submissions</h1>
        <p className="mt-1 text-[#6b7280]">
          Review and assess trainee submissions. Approve, reject, or request resubmission.
        </p>
      </div>
      <MentorSubmissions />
    </div>
  );
}
