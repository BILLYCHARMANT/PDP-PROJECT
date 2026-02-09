import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MentorGradingPageClient } from "@/components/grading/MentorGradingPageClient";

export default async function MentorGradingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "MENTOR" && session.user.role !== "ADMIN")) {
    redirect("/dashboard");
  }
  return (
    <div
      className="h-full min-h-0 flex flex-col rounded-xl p-6 overflow-hidden"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      <div className="flex-1 min-h-0 overflow-hidden">
        <MentorGradingPageClient backHref="/dashboard/mentor/submissions" />
      </div>
    </div>
  );
}
