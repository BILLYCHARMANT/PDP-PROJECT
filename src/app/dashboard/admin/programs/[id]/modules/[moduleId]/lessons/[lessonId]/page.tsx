import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LessonForm } from "@/components/admin/LessonForm";

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string; lessonId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MENTOR")) redirect("/dashboard");
  const { id: programId, moduleId, lessonId } = await params;
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
  });
  if (!lesson || lesson.moduleId !== moduleId) notFound();
  return (
    <div>
      <Link
        href={`/dashboard/admin/programs/${programId}/modules/${moduleId}`}
        className="text-sm text-slate-600 hover:text-slate-900"
      >
        ← Module
      </Link>
      <h1 className="text-2xl font-bold text-slate-800 mt-4 mb-4">Edit chapter</h1>
      <LessonForm
        moduleId={moduleId}
        programId={programId}
        lessonId={lesson.id}
        initial={{
          title: lesson.title,
          content: lesson.content ?? "",
          videoUrl: lesson.videoUrl,
          resourceUrl: lesson.resourceUrl,
          order: lesson.order,
        }}
      />
    </div>
  );
}
