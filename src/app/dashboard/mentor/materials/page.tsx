import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function MentorMaterialsPage() {
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
        <h1 className="text-2xl font-bold text-[#171717]">Materials</h1>
        <p className="mt-1 text-[#6b7280]">
          Learning materials and resources for your courses. Manage content from the Modules; materials are available to trainees in their course view.
        </p>
      </div>
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 shadow-sm">
        <p className="text-[#6b7280] mb-4">
          Materials (lessons, assignments, and concepts) are created and edited inside each module. Trainees see them under <strong>Courses</strong> and <strong>Materials</strong> in their dashboard.
        </p>
        <Link
          href="/dashboard/mentor/programs"
          className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--unipod-blue)" }}
        >
          Open Modules →
        </Link>
      </div>
    </div>
  );
}
