import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TraineeProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TRAINEE") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#171717]">Projects</h1>
      <p className="text-[#6b7280]">
        Your hands-on projects and assignments are in your courses.
      </p>
      <Link
        href="/dashboard/trainee/learn"
        className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: "var(--unipod-blue)" }}
      >
        Go to My courses
      </Link>
    </div>
  );
}
