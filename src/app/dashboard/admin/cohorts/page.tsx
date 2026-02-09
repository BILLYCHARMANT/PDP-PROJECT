import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CohortsList } from "@/components/admin/CohortsList";

export default async function AdminCohortsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");
  return (
    <div
      className="min-h-full rounded-xl p-6"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      {/* Hope LMS style: big title like "My Courses" */}
      <h1 className="text-2xl md:text-3xl font-bold text-[#171717] mb-6">
        Cohorts
      </h1>
      <CohortsList />
    </div>
  );
}
