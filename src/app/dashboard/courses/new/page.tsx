import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateCourseWizard } from "@/components/courses/CreateCourseWizard";

export default async function CreateCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; programId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MENTOR")) {
    redirect("/dashboard");
  }
  const { step, programId } = await searchParams;
  const stepNum = step === "2" ? 2 : step === "3" ? 3 : 1;
  return (
    <div
      className="min-h-full rounded-xl p-6"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      <CreateCourseWizard
        initialStep={stepNum}
        initialProgramId={programId ?? null}
        userRole={session.user.role}
      />
    </div>
  );
}
