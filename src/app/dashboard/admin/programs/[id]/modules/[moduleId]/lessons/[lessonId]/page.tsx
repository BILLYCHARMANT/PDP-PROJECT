import { redirect } from "next/navigation";

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string; lessonId: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/admin/programs/${id}`);
}
