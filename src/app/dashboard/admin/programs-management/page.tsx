import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProgramsManagementList } from "@/components/admin/ProgramsManagementList";

export default async function ProgramsManagementPage() {
  const session = await getServerSession(authOptions);
  // Only admin can access programs management
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  const canCreate = true; // Admin only page
  return (
    <div
      className="min-h-full rounded-xl p-6"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">Programs</h1>
          <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mt-1">
            Manage UNIPOD programs. Create programs, then add courses to each program.
          </p>
        </div>
      </div>
      <ProgramsManagementList showCreateAction={canCreate} />
    </div>
  );
}
