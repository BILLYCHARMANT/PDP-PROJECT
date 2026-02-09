import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ModuleForm } from "@/components/admin/ModuleForm";

export default async function NewModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MENTOR")) redirect("/dashboard");
  const { id: programId } = await params;
  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/dashboard/admin/programs/${programId}`}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          ← Program
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-4">New module</h1>
      <ModuleForm programId={programId} />
    </div>
  );
}
