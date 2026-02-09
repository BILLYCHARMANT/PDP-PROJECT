import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProgramsList } from "@/components/admin/ProgramsList";

export default async function AdminProgramsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MENTOR")) {
    redirect("/dashboard");
  }
  const canCreate = session.user.role === "ADMIN" || session.user.role === "MENTOR";
  return (
    <div
      className="min-h-full rounded-xl p-6"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">Course List</h1>
        {canCreate && (
          <Link
            href="/dashboard/courses/new"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--unipod-blue)" }}
          >
            Create Course
          </Link>
        )}
      </div>
      <ProgramsList showCreateAction={canCreate} />
    </div>
  );
}
