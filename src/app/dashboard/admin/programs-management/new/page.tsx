import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProgramProfileForm } from "@/components/admin/ProgramProfileForm";

export default async function NewProgramPage() {
  const session = await getServerSession(authOptions);
  // Only admin can create programs
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return (
    <div
      className="min-h-full rounded-xl p-6"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">Create New Program</h1>
        <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mt-1">
          Create a program profile. After creating, you can add courses to this program.
        </p>
      </div>
      <ProgramProfileForm />
    </div>
  );
}
