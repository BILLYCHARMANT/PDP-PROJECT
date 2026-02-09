import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AssignmentForm } from "@/components/admin/AssignmentForm";

export default async function EditAssignmentPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string; assignmentId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MENTOR")) redirect("/dashboard");
  const { id: programId, moduleId, assignmentId } = await params;
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });
  if (!assignment || assignment.moduleId !== moduleId) notFound();
  const initial = {
    title: assignment.title,
    description: assignment.description ?? "",
    instructions: assignment.instructions ?? "",
    dueDate: assignment.dueDate
      ? assignment.dueDate.toISOString().slice(0, 16)
      : "",
    order: assignment.order,
  };
  return (
    <div>
      <Link
        href={`/dashboard/admin/programs/${programId}/modules/${moduleId}`}
        className="text-sm text-slate-600 hover:text-slate-900"
      >
        ← Module
      </Link>
      <h1 className="text-2xl font-bold text-slate-800 mt-4 mb-4">
        Edit assignment
      </h1>
      <AssignmentForm
        moduleId={moduleId}
        programId={programId}
        assignmentId={assignment.id}
        initial={initial}
      />
    </div>
  );
}
