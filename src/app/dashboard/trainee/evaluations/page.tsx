import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TraineeEvaluationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TRAINEE") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#171717]">Evaluation quizzes</h1>
      <p className="text-[#6b7280]">
        Quizzes and evaluations are part of your module assignments. Complete them from your courses.
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
