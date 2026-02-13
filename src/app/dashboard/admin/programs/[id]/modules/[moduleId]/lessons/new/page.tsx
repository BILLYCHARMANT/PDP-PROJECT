import { redirect } from "next/navigation";

export default async function NewLessonPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/admin/programs/${id}`);
}
