import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AssignmentForm } from "@/components/admin/AssignmentForm";

export default async function NewAssignmentPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MENTOR")) redirect("/dashboard");
  const { id: courseId, moduleId } = await params;
  return (
    <div>
      <Link
        href={`/dashboard/admin/programs/${courseId}/modules/${moduleId}`}
        className="text-sm text-slate-600 hover:text-slate-900"
      >
        ← Module
      </Link>
      <h1 className="text-2xl font-bold text-slate-800 mt-4 mb-4">
        New assignment
      </h1>
      <AssignmentForm moduleId={moduleId} programId={courseId} />
    </div>
  );
}
