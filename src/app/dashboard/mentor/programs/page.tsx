import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProgramsList } from "@/components/admin/ProgramsList";

export default async function MentorProgramsPage() {
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
        <h1 className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">Course List</h1>
        <p className="mt-1 text-[#6b7280] dark:text-[#9ca3af]">
          Create and edit courses, modules, chapters (lessons), and assignments.
        </p>
      </div>
      <ProgramsList showCreateAction={true} />
    </div>
  );
}
